
use libsql::{Connection, Database as LibSqlDatabase};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::Result;

use crate::scanner::{ScanResult, ScanProgress, ApiKeyFinding};

#[derive(Clone)]
pub struct Database {
    conn: Connection,
}

#[derive(Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
}

impl Database {
    pub async fn new() -> Result<Self> {
        let db = LibSqlDatabase::open(":memory:").await?;
        let conn = db.connect()?;
        
        let database = Self { conn };
        database.init_tables().await?;
        
        Ok(database)
    }

    async fn init_tables(&self) -> Result<()> {
        // Users table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            (),
        ).await?;

        // Scans table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                url TEXT NOT NULL,
                status TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                findings TEXT,
                total_checks INTEGER DEFAULT 0,
                completed_checks INTEGER DEFAULT 0,
                ai_recommendations TEXT,
                summary TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )",
            (),
        ).await?;

        // Scan progress table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS scan_progress (
                scan_id TEXT PRIMARY KEY,
                stage TEXT NOT NULL,
                progress INTEGER NOT NULL,
                message TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (scan_id) REFERENCES scans (id)
            )",
            (),
        ).await?;

        Ok(())
    }

    pub async fn create_user(&self, email: &str, password_hash: &str) -> Result<String> {
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (user_id.clone(), email, password_hash, now),
        ).await?;

        Ok(user_id)
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<User>> {
        let mut rows = self.conn.query(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
            (email,),
        ).await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(User {
                id: row.get::<String>(0)?,
                email: row.get::<String>(1)?,
                password_hash: row.get::<String>(2)?,
                created_at: DateTime::parse_from_rfc3339(&row.get::<String>(3)?)?.with_timezone(&Utc),
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn save_scan_result(&self, result: &ScanResult) -> Result<()> {
        let findings_json = serde_json::to_string(&result.findings)?;
        let summary_json = serde_json::to_string(&result.summary)?;
        let start_time = result.start_time.to_rfc3339();
        let end_time = result.end_time.map(|t| t.to_rfc3339());
        let now = Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT OR REPLACE INTO scans 
             (id, user_id, url, status, start_time, end_time, findings, total_checks, completed_checks, ai_recommendations, summary, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                result.id.clone(),
                result.user_id.clone(),
                result.url.clone(),
                result.status.clone(),
                start_time,
                end_time,
                findings_json,
                result.total_checks as i64,
                result.completed_checks as i64,
                result.ai_recommendations.clone(),
                summary_json,
                now,
            ),
        ).await?;

        Ok(())
    }

    pub async fn get_scan_result(&self, scan_id: &str) -> Result<Option<ScanResult>> {
        let mut rows = self.conn.query(
            "SELECT id, user_id, url, status, start_time, end_time, findings, total_checks, completed_checks, ai_recommendations, summary 
             FROM scans WHERE id = ?",
            (scan_id,),
        ).await?;

        if let Some(row) = rows.next().await? {
            let findings: Vec<ApiKeyFinding> = serde_json::from_str(&row.get::<String>(6)?)?;
            let summary = serde_json::from_str(&row.get::<String>(10)?)?;
            
            Ok(Some(ScanResult {
                id: row.get::<String>(0)?,
                user_id: row.get::<Option<String>>(1)?,
                url: row.get::<String>(2)?,
                status: row.get::<String>(3)?,
                start_time: DateTime::parse_from_rfc3339(&row.get::<String>(4)?)?.with_timezone(&Utc),
                end_time: row.get::<Option<String>>(5)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
                findings,
                total_checks: row.get::<i64>(7)? as u32,
                completed_checks: row.get::<i64>(8)? as u32,
                ai_recommendations: row.get::<Option<String>>(9)?,
                summary,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update_scan_progress(&self, scan_id: &str, progress: &ScanProgress) -> Result<()> {
        let now = Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT OR REPLACE INTO scan_progress (scan_id, stage, progress, message, updated_at) VALUES (?, ?, ?, ?, ?)",
            (scan_id, progress.stage.clone(), progress.progress as i64, progress.message.clone(), now),
        ).await?;

        Ok(())
    }

    pub async fn get_scan_progress(&self, scan_id: &str) -> Result<Option<ScanProgress>> {
        let mut rows = self.conn.query(
            "SELECT stage, progress, message FROM scan_progress WHERE scan_id = ?",
            (scan_id,),
        ).await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(ScanProgress {
                stage: row.get::<String>(0)?,
                progress: row.get::<i64>(1)? as u32,
                message: row.get::<String>(2)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn get_user_scans(&self, user_id: &str) -> Result<Vec<ScanResult>> {
        let mut rows = self.conn.query(
            "SELECT id, user_id, url, status, start_time, end_time, findings, total_checks, completed_checks, ai_recommendations, summary 
             FROM scans WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).await?;

        let mut scans = Vec::new();
        while let Some(row) = rows.next().await? {
            let findings: Vec<ApiKeyFinding> = serde_json::from_str(&row.get::<String>(6)?)?;
            let summary = serde_json::from_str(&row.get::<String>(10)?)?;
            
            scans.push(ScanResult {
                id: row.get::<String>(0)?,
                user_id: row.get::<Option<String>>(1)?,
                url: row.get::<String>(2)?,
                status: row.get::<String>(3)?,
                start_time: DateTime::parse_from_rfc3339(&row.get::<String>(4)?)?.with_timezone(&Utc),
                end_time: row.get::<Option<String>>(5)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
                findings,
                total_checks: row.get::<i64>(7)? as u32,
                completed_checks: row.get::<i64>(8)? as u32,
                ai_recommendations: row.get::<Option<String>>(9)?,
                summary,
            });
        }

        Ok(scans)
    }
}
