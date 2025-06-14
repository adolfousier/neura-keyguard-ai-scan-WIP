
import { API_PATTERNS, isHighEntropyString } from './api-patterns';
import { ApiKeyFinding, ScanResult, ScanProgress } from '@/types/scan';

export class WebsiteScanner {
  private findings: ApiKeyFinding[] = [];
  private progressCallback?: (progress: ScanProgress) => void;

  constructor(progressCallback?: (progress: ScanProgress) => void) {
    this.progressCallback = progressCallback;
  }

  async scanUrl(url: string): Promise<ScanResult> {
    const scanId = crypto.randomUUID();
    const startTime = new Date();
    
    this.findings = [];
    this.updateProgress('Initializing scan...', 0);

    try {
      // Validate URL
      const validUrl = this.validateUrl(url);
      this.updateProgress('Fetching webpage...', 10);

      // Fetch the webpage
      const response = await this.fetchWebpage(validUrl);
      this.updateProgress('Analyzing HTML content...', 30);

      // Scan HTML content
      await this.scanHtmlContent(response.html, validUrl);
      this.updateProgress('Scanning JavaScript files...', 50);

      // Scan JavaScript files
      await this.scanJavaScriptFiles(response.scripts, validUrl);
      this.updateProgress('Scanning CSS files...', 70);

      // Scan CSS files
      await this.scanCssFiles(response.styles, validUrl);
      this.updateProgress('Finalizing scan...', 90);

      // Calculate summary
      const summary = this.calculateSummary();
      this.updateProgress('Scan completed!', 100);

      return {
        id: scanId,
        url: validUrl,
        startTime,
        endTime: new Date(),
        status: 'completed',
        findings: this.findings,
        totalChecks: API_PATTERNS.length,
        completedChecks: API_PATTERNS.length,
        summary
      };
    } catch (error) {
      console.error('Scan failed:', error);
      return {
        id: scanId,
        url,
        startTime,
        endTime: new Date(),
        status: 'failed',
        findings: [],
        totalChecks: 0,
        completedChecks: 0,
        summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
      };
    }
  }

  private validateUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }
      return parsedUrl.toString();
    } catch {
      // Try adding https:// if no protocol
      try {
        const withProtocol = url.startsWith('http') ? url : `https://${url}`;
        return new URL(withProtocol).toString();
      } catch {
        throw new Error('Invalid URL format');
      }
    }
  }

  private async fetchWebpage(url: string) {
    // In a real implementation, this would use a proxy service
    // For demo purposes, we'll simulate fetching content
    const mockHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <script src="/js/app.js"></script>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <script>
        const apiKey = "sk-test123456789abcdef";
        const awsKey = "AKIAIOSFODNN7EXAMPLE";
        const config = {
            stripe: "pk_live_51234567890abcdef",
            firebase: "AIzaSyDemoKey1234567890123456789012345"
        };
    </script>
</body>
</html>`;

    return {
      html: mockHtml,
      scripts: ['/js/app.js'],
      styles: ['/css/styles.css']
    };
  }

  private async scanHtmlContent(html: string, baseUrl: string) {
    this.scanTextContent(html, 'HTML Document', baseUrl);
  }

  private async scanJavaScriptFiles(scripts: string[], baseUrl: string) {
    for (const script of scripts) {
      // Simulate JavaScript content
      const jsContent = `
        const API_KEY = "sk-live_abcdef123456789";
        const GITHUB_TOKEN = "ghp_1234567890abcdef1234567890abcdef12";
        const config = {
          openai: "sk-1234567890abcdef1234567890abcdef1234567890abcdef",
          stripe: "sk_live_1234567890abcdef1234567890abcdef"
        };
      `;
      this.scanTextContent(jsContent, `JavaScript: ${script}`, baseUrl);
    }
  }

  private async scanCssFiles(styles: string[], baseUrl: string) {
    for (const style of styles) {
      // Simulate CSS content
      const cssContent = `
        .api-demo::before {
          content: "AIzaSyDemo1234567890123456789012345";
        }
      `;
      this.scanTextContent(cssContent, `CSS: ${style}`, baseUrl);
    }
  }

  private scanTextContent(content: string, location: string, baseUrl: string) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      API_PATTERNS.forEach(pattern => {
        const matches = line.match(pattern.pattern);
        if (matches) {
          matches.forEach(match => {
            // Skip common false positives
            if (this.isFalsePositive(match, line)) return;
            
            // Calculate confidence based on context and entropy
            const confidence = this.calculateConfidence(match, line);
            
            if (confidence > 0.3) { // Minimum confidence threshold
              const finding: ApiKeyFinding = {
                id: crypto.randomUUID(),
                type: pattern.name,
                value: this.maskValue(match),
                location,
                severity: pattern.severity,
                description: pattern.description,
                context: line.trim(),
                lineNumber: index + 1,
                confidence: Math.round(confidence * 100)
              };
              
              this.findings.push(finding);
            }
          });
        }
      });
      
      // Check for high entropy strings that might be keys
      const highEntropyMatches = line.match(/[a-zA-Z0-9_\-+/=]{20,}/g);
      if (highEntropyMatches) {
        highEntropyMatches.forEach(match => {
          if (isHighEntropyString(match) && !this.isFalsePositive(match, line)) {
            const finding: ApiKeyFinding = {
              id: crypto.randomUUID(),
              type: 'High Entropy String',
              value: this.maskValue(match),
              location,
              severity: 'medium',
              description: 'Potential API key or secret detected based on entropy analysis',
              context: line.trim(),
              lineNumber: index + 1,
              confidence: 75
            };
            
            this.findings.push(finding);
          }
        });
      }
    });
  }

  private isFalsePositive(value: string, context: string): boolean {
    const lowerContext = context.toLowerCase();
    const lowerValue = value.toLowerCase();
    
    // Common false positive patterns
    const falsePositives = [
      'example', 'demo', 'test', 'placeholder', 'your_key_here',
      'insert_key', 'replace_with', 'dummy', 'fake', 'sample'
    ];
    
    return falsePositives.some(fp => 
      lowerValue.includes(fp) || lowerContext.includes(fp)
    );
  }

  private calculateConfidence(value: string, context: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for proper format
    if (value.length >= 16) confidence += 0.2;
    if (isHighEntropyString(value)) confidence += 0.2;
    
    // Decrease for test/demo contexts
    const lowerContext = context.toLowerCase();
    if (lowerContext.includes('test') || lowerContext.includes('demo')) {
      confidence -= 0.3;
    }
    
    // Increase for production contexts
    if (lowerContext.includes('prod') || lowerContext.includes('live')) {
      confidence += 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  private maskValue(value: string): string {
    if (value.length <= 8) return value;
    const start = value.slice(0, 4);
    const end = value.slice(-4);
    const middle = '*'.repeat(Math.min(value.length - 8, 20));
    return `${start}${middle}${end}`;
  }

  private calculateSummary() {
    const summary = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    
    this.findings.forEach(finding => {
      summary[finding.severity]++;
      summary.total++;
    });
    
    return summary;
  }

  private updateProgress(message: string, progress: number) {
    if (this.progressCallback) {
      this.progressCallback({
        stage: message,
        progress,
        message
      });
    }
  }
}
