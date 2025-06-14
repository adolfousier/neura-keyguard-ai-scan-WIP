
use serde::{Deserialize, Serialize};
use anyhow::Result;
use reqwest::Client;
use std::env;

use crate::scanner::ApiKeyFinding;

#[derive(Serialize)]
struct AIRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct AIResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: MessageResponse,
}

#[derive(Deserialize)]
struct MessageResponse {
    content: String,
}

pub struct AIService {
    client: Client,
    api_key: String,
    base_url: String,
}

impl AIService {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            api_key: env::var("NEURA_ROUTER_API_KEY").unwrap_or_else(|_| "demo-key".to_string()),
            base_url: env::var("NEURA_ROUTER_API_URL").unwrap_or_else(|_| "https://api.neura-router.com/v1".to_string()),
        }
    }

    pub async fn generate_recommendations(&self, findings: &[ApiKeyFinding], url: &str) -> Result<String> {
        if findings.is_empty() {
            return Ok(self.generate_no_findings_response(url));
        }

        let prompt = self.build_prompt(findings, url);
        
        // Try to call the AI service, fallback to mock if it fails
        match self.call_ai_service(&prompt).await {
            Ok(response) => Ok(response),
            Err(_) => Ok(self.generate_mock_recommendations(findings, url)),
        }
    }

    async fn call_ai_service(&self, prompt: &str) -> Result<String> {
        let request = AIRequest {
            model: "gpt-4".to_string(),
            messages: vec![
                Message {
                    role: "system".to_string(),
                    content: "You are a cybersecurity expert specializing in API key security. Provide specific, actionable recommendations for fixing exposed API keys.".to_string(),
                },
                Message {
                    role: "user".to_string(),
                    content: prompt.to_string(),
                },
            ],
            max_tokens: 1000,
            temperature: 0.3,
        };

        let response = self.client
            .post(&format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("AI service request failed"));
        }

        let ai_response: AIResponse = response.json().await?;
        Ok(ai_response.choices[0].message.content.clone())
    }

    fn build_prompt(&self, findings: &[ApiKeyFinding], url: &str) -> String {
        let findings_summary = findings.iter()
            .map(|f| format!("- {} ({}) in {}: {}", f.key_type, f.severity, f.location, f.description))
            .collect::<Vec<_>>()
            .join("\n");

        format!(
            "Security Scan Results for: {}\n\n\
            Exposed API Keys Found:\n{}\n\n\
            Please provide:\n\
            1. Immediate remediation steps for each finding\n\
            2. Best practices to prevent future exposures\n\
            3. Security implementation recommendations\n\
            4. Risk assessment and priority guidance\n\n\
            Format the response in clear sections with actionable steps.",
            url, findings_summary
        )
    }

    fn generate_mock_recommendations(&self, findings: &[ApiKeyFinding], url: &str) -> String {
        let has_critical = findings.iter().any(|f| f.severity == "critical");
        let has_high = findings.iter().any(|f| f.severity == "high");
        
        let critical_count = findings.iter().filter(|f| f.severity == "critical").count();
        let high_count = findings.iter().filter(|f| f.severity == "high").count();
        let medium_count = findings.iter().filter(|f| f.severity == "medium").count();
        let low_count = findings.iter().filter(|f| f.severity == "low").count();

        format!(
            "# 🚨 Security Recommendations for {}\n\n\
            ## Immediate Actions Required\n\n\
            {}\n\n\
            ## Remediation Steps\n\n\
            ### 1. Key Rotation Process\n\
            1. **Generate new keys** in your service provider dashboard\n\
            2. **Update environment variables** in your deployment system\n\
            3. **Revoke old keys** only after confirming new keys work\n\
            4. **Monitor logs** for any failed authentication attempts\n\n\
            ### 2. Secure Storage Implementation\n\
            - Use environment variables for all API keys\n\
            - Implement proper secrets management (HashiCorp Vault, AWS Secrets Manager)\n\
            - Never commit keys to version control\n\
            - Use different keys for development, staging, and production\n\n\
            ### 3. Code Security Best Practices\n\
            - Implement proper .gitignore rules for config files\n\
            - Use linting rules to detect potential key exposures\n\
            - Regular security audits of your codebase\n\
            - Employee training on secure coding practices\n\n\
            ## Prevention Strategies\n\n\
            ### Frontend Security\n\
            - Never expose secret keys in client-side code\n\
            - Use public/publishable keys where appropriate\n\
            - Implement proper API proxy patterns for sensitive operations\n\
            - Regular dependency scanning for vulnerabilities\n\n\
            ### Backend Security\n\
            - Implement proper authentication middleware\n\
            - Use least-privilege access principles\n\
            - Regular key rotation schedules\n\
            - Monitor API usage for anomalies\n\n\
            ## Risk Assessment\n\n\
            **Overall Risk Level**: {}\n\
            **Estimated Fix Time**: {}\n\
            **Priority Score**: {}/100\n\n\
            ## Findings Summary\n\
            - Critical: {}\n\
            - High: {}\n\
            - Medium: {}\n\
            - Low: {}\n\n\
            ## Next Steps\n\
            1. Address critical findings immediately\n\
            2. Implement secure storage for all keys\n\
            3. Set up monitoring and alerting\n\
            4. Schedule regular security reviews\n\
            5. Consider implementing automated scanning in CI/CD pipeline\n\n\
            *This analysis was generated by KeyGuard AI Scan.*",
            url,
            if has_critical {
                "### 🔴 CRITICAL - Take Action Now\n\
                Multiple critical API keys detected. These keys must be revoked immediately \n\
                to prevent unauthorized access and potential financial damage.\n\n\
                ### 🟡 HIGH PRIORITY - Fix Today\n\
                High-severity keys detected that could lead to data breaches or service disruption."
            } else if has_high {
                "### 🟡 HIGH PRIORITY - Fix Today\n\
                High-severity keys detected that could lead to data breaches or service disruption."
            } else {
                "### ✅ No Critical Issues Found\n\
                Medium and low severity issues detected. Address these to improve security posture."
            },
            if has_critical { "HIGH" } else if has_high { "MEDIUM-HIGH" } else { "MEDIUM" },
            if critical_count > 0 { "1-2 hours" } else { "2-4 hours" },
            findings.len() * 10,
            critical_count,
            high_count,
            medium_count,
            low_count
        )
    }

    fn generate_no_findings_response(&self, url: &str) -> String {
        format!(
            "# ✅ Security Scan Results for {}\n\n\
            ## Excellent News!\n\n\
            No exposed API keys were detected during the scan. Your website appears to follow \n\
            good security practices for API key management.\n\n\
            ## Recommendations for Continued Security\n\n\
            ### 1. Regular Security Audits\n\
            - Schedule monthly security scans\n\
            - Implement automated security testing in CI/CD\n\
            - Regular dependency vulnerability scanning\n\n\
            ### 2. Best Practices to Maintain\n\
            - Continue using environment variables for secrets\n\
            - Regular key rotation schedules\n\
            - Proper access controls and authentication\n\
            - Security-focused code reviews\n\n\
            ### 3. Additional Security Measures\n\
            - Implement Content Security Policy (CSP)\n\
            - Use HTTPS everywhere\n\
            - Regular backup and disaster recovery testing\n\
            - Employee security training\n\n\
            **Keep up the excellent security practices!**\n\n\
            *Scan completed by KeyGuard AI Scan - No action required.*",
            url
        )
    }
}
