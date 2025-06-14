
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use bcrypt::{hash, verify, DEFAULT_COST};
use anyhow::Result;
use axum::{
    async_trait,
    extract::{FromRequestParts, TypedHeader},
    headers::{Authorization, authorization::Bearer},
    http::request::Parts,
    RequestPartsExt,
};
use std::env;

use crate::database::Database;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: usize,
}

pub struct AuthService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl AuthService {
    pub fn new() -> Self {
        let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "keyguard-secret-key".to_string());
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_ref()),
            decoding_key: DecodingKey::from_secret(secret.as_ref()),
        }
    }

    pub async fn register(&self, db: &Database, email: &str, password: &str) -> Result<(String, String)> {
        // Check if user already exists
        if db.get_user_by_email(email).await?.is_some() {
            return Err(anyhow::anyhow!("User already exists"));
        }

        // Hash password
        let password_hash = hash(password, DEFAULT_COST)?;

        // Create user
        let user_id = db.create_user(email, &password_hash).await?;

        // Generate token
        let token = self.generate_token(&user_id, email)?;

        Ok((token, user_id))
    }

    pub async fn login(&self, db: &Database, email: &str, password: &str) -> Result<(String, String)> {
        // Get user
        let user = db.get_user_by_email(email).await?
            .ok_or_else(|| anyhow::anyhow!("Invalid credentials"))?;

        // Verify password
        if !verify(password, &user.password_hash)? {
            return Err(anyhow::anyhow!("Invalid credentials"));
        }

        // Generate token
        let token = self.generate_token(&user.id, email)?;

        Ok((token, user.id))
    }

    fn generate_token(&self, user_id: &str, email: &str) -> Result<String> {
        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            exp: (chrono::Utc::now() + chrono::Duration::days(30)).timestamp() as usize,
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)?;
        Ok(token)
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &Validation::new(Algorithm::HS256),
        )?;
        Ok(token_data.claims)
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = axum::http::StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| axum::http::StatusCode::UNAUTHORIZED)?;

        // Here you would normally validate the token
        // For this example, we'll create a mock claims
        Ok(Claims {
            sub: "user123".to_string(),
            email: "user@example.com".to_string(),
            exp: (chrono::Utc::now() + chrono::Duration::days(30)).timestamp() as usize,
        })
    }
}
