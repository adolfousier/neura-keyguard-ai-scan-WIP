
interface AIRecommendationRequest {
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    location: string;
  }>;
  url: string;
}

export class AIRecommendationService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // These would normally come from environment variables
    this.apiKey = 'demo-key'; // NEURA_ROUTER_API_KEY
    this.baseUrl = 'https://api.neura-router.com/v1'; // NEURA_ROUTER_API_URL
  }

  async getRecommendations(request: AIRecommendationRequest): Promise<string> {
    try {
      // For demo purposes, return mock recommendations
      // In production, this would call the actual NEURA_ROUTER API
      return this.generateMockRecommendations(request);
    } catch (error) {
      console.error('AI recommendation failed:', error);
      return this.getFallbackRecommendations(request);
    }
  }

  private async callNeuraRouter(request: AIRecommendationRequest): Promise<string> {
    const prompt = this.buildPrompt(request);
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert specializing in API key security. Provide specific, actionable recommendations for fixing exposed API keys.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private buildPrompt(request: AIRecommendationRequest): string {
    const findingsSummary = request.findings.map(f => 
      `- ${f.type} (${f.severity}) in ${f.location}: ${f.description}`
    ).join('\n');

    return `
Security Scan Results for: ${request.url}

Exposed API Keys Found:
${findingsSummary}

Please provide:
1. Immediate remediation steps for each finding
2. Best practices to prevent future exposures
3. Security implementation recommendations
4. Risk assessment and priority guidance

Format the response in clear sections with actionable steps.
`;
  }

  private generateMockRecommendations(request: AIRecommendationRequest): string {
    const hasHighSeverity = request.findings.some(f => 
      f.severity === 'critical' || f.severity === 'high'
    );

    const criticalFindings = request.findings.filter(f => f.severity === 'critical');
    const highFindings = request.findings.filter(f => f.severity === 'high');

    return `
# 🚨 Security Recommendations for ${request.url}

## Immediate Actions Required

${hasHighSeverity ? `
### 🔴 CRITICAL - Take Action Now
${criticalFindings.map(f => `
**${f.type}** detected in ${f.location}
- **Immediate Action**: Revoke this key immediately from your ${this.getProviderName(f.type)} dashboard
- **Risk**: This key can be used to access your account and incur charges
- **Timeline**: Fix within 1 hour
`).join('\n')}

### 🟡 HIGH PRIORITY - Fix Today
${highFindings.map(f => `
**${f.type}** detected in ${f.location}
- **Action**: Rotate this key and update your application
- **Risk**: Potential unauthorized access to services
- **Timeline**: Fix within 24 hours
`).join('\n')}
` : '### ✅ No Critical Issues Found'}

## Remediation Steps

### 1. Key Rotation Process
1. **Generate new keys** in your service provider dashboard
2. **Update environment variables** in your deployment system
3. **Revoke old keys** only after confirming new keys work
4. **Monitor logs** for any failed authentication attempts

### 2. Secure Storage Implementation
- Use environment variables for all API keys
- Implement proper secrets management (HashiCorp Vault, AWS Secrets Manager)
- Never commit keys to version control
- Use different keys for development, staging, and production

### 3. Code Security Best Practices
- Implement proper .gitignore rules for config files
- Use linting rules to detect potential key exposures
- Regular security audits of your codebase
- Employee training on secure coding practices

## Prevention Strategies

### Frontend Security
- Never expose secret keys in client-side code
- Use public/publishable keys where appropriate
- Implement proper API proxy patterns for sensitive operations
- Regular dependency scanning for vulnerabilities

### Backend Security
- Implement proper authentication middleware
- Use least-privilege access principles
- Regular key rotation schedules
- Monitor API usage for anomalies

## Risk Assessment

**Overall Risk Level**: ${hasHighSeverity ? 'HIGH' : 'MEDIUM'}
**Estimated Fix Time**: ${criticalFindings.length > 0 ? '1-2 hours' : '2-4 hours'}
**Priority Score**: ${request.findings.length * 10}/100

## Next Steps
1. Address critical findings immediately
2. Implement secure storage for all keys
3. Set up monitoring and alerting
4. Schedule regular security reviews
5. Consider implementing automated scanning in CI/CD pipeline

## Additional Resources
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)

*This analysis was generated by KeyGuard AI Scan. For technical support, visit our documentation.*
`;
  }

  private getProviderName(keyType: string): string {
    const providers: { [key: string]: string } = {
      'AWS Access Key': 'AWS Console',
      'AWS Secret Key': 'AWS Console',
      'Google Cloud API Key': 'Google Cloud Console',
      'GitHub Token': 'GitHub Settings',
      'Stripe Publishable Key': 'Stripe Dashboard',
      'Stripe Secret Key': 'Stripe Dashboard',
      'OpenAI API Key': 'OpenAI Platform',
      'Azure Subscription Key': 'Azure Portal'
    };
    
    return providers[keyType] || 'service provider';
  }

  private getFallbackRecommendations(request: AIRecommendationRequest): string {
    return `
# Security Recommendations

## Immediate Actions
Based on the detected API keys, you should:

1. **Revoke exposed keys immediately**
2. **Generate new keys** from your service providers
3. **Update your applications** with new keys
4. **Monitor for unauthorized usage**

## Best Practices
- Store API keys in environment variables
- Never commit keys to version control
- Use different keys for different environments
- Implement proper access controls
- Regular security audits

## Critical Findings: ${request.findings.filter(f => f.severity === 'critical').length}
## High Priority: ${request.findings.filter(f => f.severity === 'high').length}
## Medium Priority: ${request.findings.filter(f => f.severity === 'medium').length}

*AI recommendations temporarily unavailable. These are standard security guidelines.*
`;
  }
}
