
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanProgress } from "@/components/ScanProgress";
import { ScanResults } from "@/components/ScanResults";
import { WebsiteScanner } from "@/lib/scanner";
import { ScanResult, ScanProgress as ScanProgressType } from "@/types/scan";
import { analytics } from "@/lib/analytics";
import { 
  Shield, 
  Search, 
  Zap, 
  Brain, 
  Github, 
  Star,
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  Cpu,
  BarChart3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgressType | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    analytics.trackPageView('landing');
  }, []);

  const handleScan = useCallback(async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to scan.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setScanProgress(null);
    
    const startTime = Date.now();
    analytics.trackScanStarted(url);

    try {
      const scanner = new WebsiteScanner((progress) => {
        setScanProgress(progress);
      });

      const result = await scanner.scanUrl(url);
      setScanResult(result);
      
      const duration = Date.now() - startTime;
      analytics.trackScanCompleted(url, duration, result.findings.length);

      if (result.status === 'completed') {
        toast({
          title: "Scan Completed",
          description: `Found ${result.findings.length} potential security issues.`,
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      analytics.trackScanFailed(url, error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: "Scan Failed",
        description: "Unable to complete the scan. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  }, [url]);

  const resetScan = useCallback(() => {
    setUrl("");
    setScanResult(null);
    setScanProgress(null);
    setIsScanning(false);
  }, []);

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <ScanResults result={scanResult} onNewScan={resetScan} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KeyGuard AI Scan</h1>
              <p className="text-sm text-gray-600">Open-source API key security scanner</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="hidden md:flex">
              <Star className="h-3 w-3 mr-1" />
              Free & Open Source
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com/keyguard-ai/scan" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Detect & Fix
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> API Key Leaks </span>
              Instantly
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Scan any website for exposed API keys with advanced AI-powered detection. 
              Get intelligent recommendations to secure your applications in seconds.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                100+ API Key Types
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Brain className="h-4 w-4 mr-2 text-purple-600" />
                AI-Powered Analysis
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Zap className="h-4 w-4 mr-2 text-yellow-600" />
                Real-time Scanning
              </Badge>
            </div>
          </div>
        </div>

        {/* Scan Interface */}
        <Card className="max-w-2xl mx-auto mb-12 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Start Security Scan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isScanning && scanProgress ? (
              <ScanProgress progress={scanProgress} />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium text-gray-700">
                    Website URL
                  </label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                    className="text-lg py-3"
                    disabled={isScanning}
                  />
                  <p className="text-xs text-gray-500">
                    Enter any website URL to scan for exposed API keys and security vulnerabilities
                  </p>
                </div>
                
                <Button 
                  onClick={handleScan} 
                  disabled={isScanning || !url.trim()}
                  className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isScanning ? (
                    <>
                      <Search className="h-5 w-5 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Start Security Scan
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Comprehensive Detection</h3>
              </div>
              <p className="text-gray-600">
                Scans HTML, JavaScript, CSS, and network requests for 100+ different API key patterns from major providers.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
              </div>
              <p className="text-gray-600">
                Get intelligent, context-aware security recommendations powered by advanced AI models.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Lock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Privacy First</h3>
              </div>
              <p className="text-gray-600">
                No data stored permanently. Open-source code you can trust and audit yourself.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
              </div>
              <p className="text-gray-600">
                Advanced scanning algorithms complete most website analyses in under 30 seconds.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Smart Detection</h3>
              </div>
              <p className="text-gray-600">
                Advanced entropy analysis and pattern matching reduces false positives while catching real threats.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Detailed Reports</h3>
              </div>
              <p className="text-gray-600">
                Export comprehensive reports in multiple formats for security audits and compliance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="max-w-4xl mx-auto border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Secure Your Website?</h3>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of developers using KeyGuard AI Scan to protect their applications from API key exposures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => setUrl("https://")}>
                <Shield className="h-5 w-5 mr-2" />
                Start Free Scan
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-purple-600" asChild>
                <a href="https://github.com/keyguard-ai/scan" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5 mr-2" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Built with ❤️ by the security community • 
              <a href="https://github.com/keyguard-ai/scan" className="text-blue-600 hover:underline ml-1">
                Open Source
              </a>
            </p>
            <p className="text-sm">
              Help protect the web, one scan at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
