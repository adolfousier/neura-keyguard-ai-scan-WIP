
import { apiClient, type ScanResult, type ScanProgress } from './api-client';
import { analytics } from './analytics';

export interface ScanOptions {
  url: string;
  userId?: string;
}

export class ScannerClient {
  async startScan(options: ScanOptions): Promise<ScanResult> {
    analytics.trackScanStarted(options.url);
    
    try {
      const result = await apiClient.startScan({
        url: options.url,
        user_id: options.userId,
      });
      
      console.log('Scan started:', result);
      return result;
    } catch (error) {
      analytics.trackScanFailed(options.url, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getScanResult(scanId: string): Promise<ScanResult> {
    return apiClient.getScanResult(scanId);
  }

  async getScanProgress(scanId: string): Promise<ScanProgress> {
    return apiClient.getScanProgress(scanId);
  }

  async pollScanProgress(
    scanId: string,
    onProgress: (progress: ScanProgress) => void,
    onComplete: (result: ScanResult) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const poll = async () => {
      try {
        const result = await this.getScanResult(scanId);
        
        if (result.status === 'completed') {
          analytics.trackScanCompleted(
            result.url,
            result.end_time ? new Date(result.end_time).getTime() - new Date(result.start_time).getTime() : 0,
            result.findings.length
          );
          onComplete(result);
          return;
        }
        
        if (result.status === 'failed') {
          throw new Error('Scan failed');
        }
        
        // Get progress
        try {
          const progress = await this.getScanProgress(scanId);
          onProgress(progress);
        } catch {
          // Progress endpoint might not have data yet
          onProgress({
            stage: 'Scanning',
            progress: result.completed_checks / result.total_checks * 100,
            message: `Completed ${result.completed_checks}/${result.total_checks} checks`,
          });
        }
        
        // Continue polling
        setTimeout(poll, 2000);
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    };
    
    poll();
  }
}

export const scannerClient = new ScannerClient();
