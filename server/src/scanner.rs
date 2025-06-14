
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use reqwest::Client;
use scraper::{Html, Selector};
use regex::Regex;
use anyhow::Result;
use std::collections::HashMap;

use crate::database::Database;
use crate::ai_service::AIService;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanRequest {
    pub url: String,
    pub user_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanResult {
    pub id: String,
    pub user_id: Option<String>,
    pub url: String,
    pub status: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub findings: Vec<ApiKeyFinding>,
    pub total_checks: u32,
    pub completed_checks: u32,
    pub ai_recommendations: Option<String>,
    pub summary: ScanSummary,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanProgress {
    pub stage: String,
    pub progress: u32,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiKeyFinding {
    pub id: String,
    pub key_type: String,
    pub value: String,
    pub location: String,
    pub severity: String,
    pub description: String,
    pub recommendation: Option<String>,
    pub context: String,
    pub line_number: Option<u32>,
    pub confidence: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanSummary {
    pub critical: u32,
    pub high: u32,
    pub medium: u32,
    pub low: u32,
    pub total: u32,
}

#[derive(Debug)]
struct ApiPattern {
    name: String,
    pattern: Regex,
    severity: String,
    description: String,
    provider: String,
}

pub async fn start_scan(db: &Database, request: ScanRequest) -> Result<ScanResult> {
    let scan_id = Uuid::new_v4().to_string();
    let start_time = Utc::now();
    
    let mut result = ScanResult {
        id: scan_id.clone(),
        user_id: request.user_id.clone(),
        url: request.url.clone(),
        status: "scanning".to_string(),
        start_time,
        end_time: None,
        findings: Vec::new(),
        total_checks: 100,
        completed_checks: 0,
        ai_recommendations: None,
        summary: ScanSummary {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            total: 0,
        },
    };

    // Save initial scan state
    db.save_scan_result(&result).await?;

    // Start scanning process
    tokio::spawn(async move {
        let db_clone = db.clone();
        if let Err(e) = perform_scan(db_clone, scan_id, request).await {
            eprintln!("Scan failed: {}", e);
        }
    });

    Ok(result)
}

async fn perform_scan(db: Database, scan_id: String, request: ScanRequest) -> Result<()> {
    let client = Client::new();
    let patterns = get_api_patterns();
    
    // Update progress
    update_progress(&db, &scan_id, "Fetching website content", 10).await?;
    
    // Fetch main page
    let response = client.get(&request.url).send().await?;
    let html_content = response.text().await?;
    
    update_progress(&db, &scan_id, "Analyzing HTML content", 30).await?;
    
    // Parse HTML
    let document = Html::parse_document(&html_content);
    let mut findings = Vec::new();
    
    // Scan HTML content
    findings.extend(scan_text_content(&html_content, "HTML", &patterns));
    
    update_progress(&db, &scan_id, "Scanning JavaScript files", 50).await?;
    
    // Extract and scan JavaScript files
    let script_selector = Selector::parse("script[src]").unwrap();
    for element in document.select(&script_selector) {
        if let Some(src) = element.value().attr("src") {
            let script_url = resolve_url(&request.url, src);
            if let Ok(script_response) = client.get(&script_url).send().await {
                if let Ok(script_content) = script_response.text().await {
                    findings.extend(scan_text_content(&script_content, &format!("JavaScript: {}", src), &patterns));
                }
            }
        }
    }
    
    // Scan inline JavaScript
    let inline_script_selector = Selector::parse("script:not([src])").unwrap();
    for element in document.select(&inline_script_selector) {
        let script_content = element.inner_html();
        findings.extend(scan_text_content(&script_content, "Inline JavaScript", &patterns));
    }
    
    update_progress(&db, &scan_id, "Scanning CSS files", 70).await?;
    
    // Scan CSS files
    let css_selector = Selector::parse("link[rel='stylesheet']").unwrap();
    for element in document.select(&css_selector) {
        if let Some(href) = element.value().attr("href") {
            let css_url = resolve_url(&request.url, href);
            if let Ok(css_response) = client.get(&css_url).send().await {
                if let Ok(css_content) = css_response.text().await {
                    findings.extend(scan_text_content(&css_content, &format!("CSS: {}", href), &patterns));
                }
            }
        }
    }
    
    update_progress(&db, &scan_id, "Generating AI recommendations", 90).await?;
    
    // Generate AI recommendations
    let ai_service = AIService::new();
    let ai_recommendations = ai_service.generate_recommendations(&findings, &request.url).await?;
    
    // Calculate summary
    let summary = calculate_summary(&findings);
    
    // Update final result
    let end_time = Utc::now();
    let final_result = ScanResult {
        id: scan_id.clone(),
        user_id: request.user_id,
        url: request.url,
        status: "completed".to_string(),
        start_time: db.get_scan_result(&scan_id).await?.unwrap().start_time,
        end_time: Some(end_time),
        findings,
        total_checks: 100,
        completed_checks: 100,
        ai_recommendations: Some(ai_recommendations),
        summary,
    };
    
    db.save_scan_result(&final_result).await?;
    update_progress(&db, &scan_id, "Scan completed", 100).await?;
    
    Ok(())
}

fn get_api_patterns() -> Vec<ApiPattern> {
    vec![
        ApiPattern {
            name: "AWS Access Key".to_string(),
            pattern: Regex::new(r"AKIA[0-9A-Z]{16}").unwrap(),
            severity: "critical".to_string(),
            description: "Amazon Web Services access key detected".to_string(),
            provider: "AWS".to_string(),
        },
        ApiPattern {
            name: "GitHub Token".to_string(),
            pattern: Regex::new(r"ghp_[a-zA-Z0-9]{36}").unwrap(),
            severity: "high".to_string(),
            description: "GitHub personal access token detected".to_string(),
            provider: "GitHub".to_string(),
        },
        ApiPattern {
            name: "OpenAI API Key".to_string(),
            pattern: Regex::new(r"sk-[a-zA-Z0-9]{48}").unwrap(),
            severity: "high".to_string(),
            description: "OpenAI API key detected".to_string(),
            provider: "OpenAI".to_string(),
        },
        ApiPattern {
            name: "Stripe Secret Key".to_string(),
            pattern: Regex::new(r"sk_live_[0-9a-zA-Z]{24}").unwrap(),
            severity: "critical".to_string(),
            description: "Stripe secret API key detected".to_string(),
            provider: "Stripe".to_string(),
        },
        ApiPattern {
            name: "Google Cloud API Key".to_string(),
            pattern: Regex::new(r"AIza[0-9A-Za-z-_]{35}").unwrap(),
            severity: "high".to_string(),
            description: "Google Cloud Platform API key detected".to_string(),
            provider: "Google Cloud".to_string(),
        },
    ]
}

fn scan_text_content(content: &str, location: &str, patterns: &[ApiPattern]) -> Vec<ApiKeyFinding> {
    let mut findings = Vec::new();
    
    for pattern in patterns {
        for mat in pattern.pattern.find_iter(content) {
            let finding = ApiKeyFinding {
                id: Uuid::new_v4().to_string(),
                key_type: pattern.name.clone(),
                value: mask_key(mat.as_str()),
                location: location.to_string(),
                severity: pattern.severity.clone(),
                description: pattern.description.clone(),
                recommendation: Some(generate_recommendation(&pattern.name, &pattern.provider)),
                context: extract_context(content, mat.start(), mat.end()),
                line_number: Some(calculate_line_number(content, mat.start())),
                confidence: calculate_confidence(mat.as_str()),
            };
            findings.push(finding);
        }
    }
    
    findings
}

fn mask_key(key: &str) -> String {
    if key.len() <= 8 {
        "*".repeat(key.len())
    } else {
        format!("{}...{}", &key[..4], &key[key.len()-4..])
    }
}

fn generate_recommendation(key_type: &str, provider: &str) -> String {
    format!(
        "Immediately revoke this {} from your {} dashboard and generate a new one. \
        Store the new key securely using environment variables or a secrets manager.",
        key_type, provider
    )
}

fn extract_context(content: &str, start: usize, end: usize) -> String {
    let context_start = start.saturating_sub(50);
    let context_end = (end + 50).min(content.len());
    content[context_start..context_end].to_string()
}

fn calculate_line_number(content: &str, position: usize) -> u32 {
    content[..position].chars().filter(|&c| c == '\n').count() as u32 + 1
}

fn calculate_confidence(key: &str) -> f32 {
    // Simple entropy-based confidence calculation
    let entropy = calculate_entropy(key);
    if entropy > 4.5 { 0.95 } else if entropy > 3.5 { 0.8 } else { 0.6 }
}

fn calculate_entropy(s: &str) -> f32 {
    let mut freq = HashMap::new();
    for c in s.chars() {
        *freq.entry(c).or_insert(0) += 1;
    }
    
    let len = s.len() as f32;
    freq.values()
        .map(|&count| {
            let p = count as f32 / len;
            -p * p.log2()
        })
        .sum()
}

fn calculate_summary(findings: &[ApiKeyFinding]) -> ScanSummary {
    let mut summary = ScanSummary {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: findings.len() as u32,
    };
    
    for finding in findings {
        match finding.severity.as_str() {
            "critical" => summary.critical += 1,
            "high" => summary.high += 1,
            "medium" => summary.medium += 1,
            "low" => summary.low += 1,
            _ => {}
        }
    }
    
    summary
}

fn resolve_url(base: &str, relative: &str) -> String {
    if relative.starts_with("http") {
        relative.to_string()
    } else if relative.starts_with("//") {
        format!("https:{}", relative)
    } else if relative.starts_with("/") {
        let base_url = url::Url::parse(base).unwrap();
        format!("{}://{}{}", base_url.scheme(), base_url.host_str().unwrap(), relative)
    } else {
        format!("{}/{}", base.trim_end_matches('/'), relative)
    }
}

async fn update_progress(db: &Database, scan_id: &str, message: &str, progress: u32) -> Result<()> {
    let progress_update = ScanProgress {
        stage: message.to_string(),
        progress,
        message: message.to_string(),
    };
    db.update_scan_progress(scan_id, &progress_update).await
}
