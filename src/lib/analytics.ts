import { Langfuse } from "langfuse";

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class AnalyticsService {
  private langfuse: Langfuse | null = null;
  private sessionId: string;
  private userId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.initializeLangfuse();
  }

  private initializeLangfuse() {
    try {
      // In production, these would come from environment variables
      const publicKey = 'demo-public-key';
      const secretKey = 'demo-secret-key';
      const baseUrl = 'https://cloud.langfuse.com';

      this.langfuse = new Langfuse({
        publicKey,
        secretKey,
        baseUrl
      });
      
      console.log('Analytics service initialized');
    } catch (error) {
      console.warn('Failed to initialize analytics:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string {
    let userId = localStorage.getItem('keyguard_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('keyguard_user_id', userId);
    }
    return userId;
  }

  track(event: string, properties: Record<string, any> = {}) {
    try {
      // Log to console for development
      console.log('Analytics Event:', { event, properties, userId: this.userId, sessionId: this.sessionId });

      // Send to Langfuse if available
      if (this.langfuse) {
        this.langfuse.event({
          name: event,
          metadata: {
            ...properties,
            userId: this.userId,
            sessionId: this.sessionId
          },
          input: properties,
          timestamp: new Date()
        });
      }

      // Store locally for offline analytics
      this.storeLocalEvent({ event, properties, userId: this.userId, sessionId: this.sessionId });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  private storeLocalEvent(eventData: AnalyticsEvent) {
    try {
      const events = JSON.parse(localStorage.getItem('keyguard_analytics') || '[]');
      events.push({
        ...eventData,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('keyguard_analytics', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store local analytics:', error);
    }
  }

  // Predefined tracking methods for common events
  trackPageView(page: string) {
    this.track('page_view', { page, url: window.location.href });
  }

  trackScanStarted(url: string) {
    this.track('scan_started', { target_url: url });
  }

  trackScanCompleted(url: string, duration: number, findingsCount: number) {
    this.track('scan_completed', { 
      target_url: url, 
      duration_ms: duration,
      findings_count: findingsCount 
    });
  }

  trackScanFailed(url: string, error: string) {
    this.track('scan_failed', { target_url: url, error });
  }

  trackAIRecommendationsViewed(findingsCount: number) {
    this.track('ai_recommendations_viewed', { findings_count: findingsCount });
  }

  trackResultsExported(format: string) {
    this.track('results_exported', { format });
  }

  trackResultsShared() {
    this.track('results_shared');
  }

  trackFeatureUsed(feature: string, details: Record<string, any> = {}) {
    this.track('feature_used', { feature, ...details });
  }

  // Get analytics data for debugging
  getLocalAnalytics() {
    try {
      return JSON.parse(localStorage.getItem('keyguard_analytics') || '[]');
    } catch {
      return [];
    }
  }

  // Clear local analytics data
  clearLocalAnalytics() {
    localStorage.removeItem('keyguard_analytics');
  }
}

export const analytics = new AnalyticsService();
