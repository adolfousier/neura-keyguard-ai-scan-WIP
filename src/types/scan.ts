
export interface ApiKeyFinding {
  id: string;
  type: string;
  value: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
  context: string;
  lineNumber?: number;
  confidence: number;
}

export interface ScanResult {
  id: string;
  url: string;
  startTime: Date;
  endTime?: Date;
  status: 'scanning' | 'completed' | 'failed' | 'analyzing';
  findings: ApiKeyFinding[];
  totalChecks: number;
  completedChecks: number;
  aiRecommendations?: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export interface ScanProgress {
  stage: string;
  progress: number;
  message: string;
}
