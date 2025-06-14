
import { ScanResult } from "@/types/scan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Shield, 
  Download, 
  Share, 
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { AIRecommendations } from "./AIRecommendations";

interface ScanResultsProps {
  result: ScanResult;
  onNewScan: () => void;
}

export const ScanResults = ({ result, onNewScan }: ScanResultsProps) => {
  const [showRecommendations, setShowRecommendations] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const exportResults = () => {
    const data = {
      url: result.url,
      scanDate: result.startTime,
      summary: result.summary,
      findings: result.findings.map(f => ({
        type: f.type,
        severity: f.severity,
        location: f.location,
        description: f.description,
        confidence: f.confidence
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyguard-scan-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareResults = () => {
    const text = `KeyGuard AI Scan Results for ${result.url}\n${result.summary.total} potential issues found\n${result.summary.critical} critical, ${result.summary.high} high priority`;
    navigator.share?.({ 
      title: 'KeyGuard Scan Results', 
      text 
    }) || navigator.clipboard.writeText(text);
  };

  if (result.status === 'failed') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <XCircle className="h-6 w-6" />
            <span>Scan Failed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Unable to complete the scan for {result.url}. Please check the URL and try again.
          </p>
          <Button onClick={onNewScan}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>Scan Results</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportResults}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={shareResults}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
              <div className="text-sm text-gray-600">Total Findings</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {result.summary.critical + result.summary.high}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {result.summary.medium + result.summary.low}
              </div>
              <div className="text-sm text-gray-600">Lower Priority</div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{result.url}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{result.startTime.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>{result.completedChecks} checks completed</span>
            </div>
          </div>

          {result.summary.total > 0 && (
            <div className="mt-4">
              <Button 
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="w-full"
              >
                {showRecommendations ? 'Hide' : 'Get'} AI Recommendations
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {showRecommendations && (
        <AIRecommendations 
          findings={result.findings}
          url={result.url}
        />
      )}

      {/* Severity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Severity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { level: 'critical', count: result.summary.critical, color: 'red' },
              { level: 'high', count: result.summary.high, color: 'orange' },
              { level: 'medium', count: result.summary.medium, color: 'yellow' },
              { level: 'low', count: result.summary.low, color: 'blue' }
            ].map(({ level, count, color }) => (
              <div key={level} className="text-center p-3 border rounded-lg">
                <div className={`text-2xl font-bold text-${color}-600`}>{count}</div>
                <div className="text-sm capitalize">{level}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Findings</CardTitle>
        </CardHeader>
        <CardContent>
          {result.findings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Keys Found</h3>
              <p className="text-gray-600">Great! No exposed API keys were detected on this website.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.findings.map((finding, index) => (
                <div key={finding.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getSeverityIcon(finding.severity)}
                      <div>
                        <h4 className="font-semibold text-gray-900">{finding.type}</h4>
                        <p className="text-sm text-gray-600">{finding.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(finding.severity)}>
                        {finding.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {finding.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Location: </span>
                      <span className="text-sm text-gray-600">{finding.location}</span>
                      {finding.lineNumber && (
                        <span className="text-sm text-gray-500"> (Line {finding.lineNumber})</span>
                      )}
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Found: </span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                        {finding.value}
                      </code>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Context: </span>
                      <code className="text-sm bg-gray-50 px-2 py-1 rounded block mt-1 font-mono">
                        {finding.context}
                      </code>
                    </div>

                    {finding.recommendation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-900">Recommendation: </span>
                        <p className="text-sm text-blue-800">{finding.recommendation}</p>
                      </div>
                    )}
                  </div>
                  
                  {index < result.findings.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        <Button onClick={onNewScan} size="lg">
          Scan Another Website
        </Button>
      </div>
    </div>
  );
};
