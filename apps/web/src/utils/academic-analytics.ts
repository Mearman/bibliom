/**
 * Academic Analytics Utilities
 *
 * Privacy-compliant analytics functions for academic research workflow tracking.
 * Designed to provide insights while maintaining user privacy and GDPR compliance.
 */

import type { AcademicEventProperties, AcademicEventType, EntityTypeType } from '@/lib/posthog';

/**
 * PostHog instance type definition
 */
interface PostHogInstance {
  capture: (eventName: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
}

/**
 * Window with PostHog instance
 */
interface WindowWithPostHog {
  posthog?: PostHogInstance;
}

/**
 * Academic Analytics Service
 * Provides privacy-compliant analytics tracking for academic research workflows
 */
class AcademicAnalytics {
  private static posthogAvailable(): boolean {
    return typeof window !== 'undefined' && 'posthog' in window;
  }

  private static getUserAgentGroup(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'other';
  }

  /**
   * Capture academic-specific analytics event
   * @param eventName
   * @param properties
   */
  static capture(eventName: AcademicEventType, properties?: AcademicEventProperties): void {
    if (!this.posthogAvailable()) {
      return;
    }

    try {
      const posthog = (window as unknown as WindowWithPostHog).posthog;
      if (!posthog) return;

      // Enhanced properties with privacy-safe data
      const enhancedProperties = {
        ...properties,
        user_agent_group: this.getUserAgentGroup(),
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId(),
      };

      posthog.capture(eventName, enhancedProperties);

      if (import.meta.env.DEV) {
        console.debug(`📊 Academic Analytics: ${eventName}`, enhancedProperties);
      }
    } catch (error) {
      console.warn('Failed to capture academic analytics event:', error);
    }
  }

  /**
   * Track search events with privacy protection
   * @param entityType
   * @param resultCount
   * @param hasFilters
   */
  static trackSearchPerformed(entityType: string, resultCount: number, hasFilters: boolean): void {
    this.capture('search_performed', {
      entity_type: entityType as EntityTypeType,
      search_category: 'literature_search',
      result_count: Math.min(resultCount, 1000), // Cap for privacy
      has_filters: hasFilters,
      feature_name: 'search',
    });
  }

  /**
   * Track entity detail page views
   * @param entityType
   */
  static trackEntityView(entityType: string): void {
    this.capture('entity_view', {
      entity_type: entityType as EntityTypeType,
      feature_name: 'entity_detail_layout',
    });
  }

  /**
   * Track graph interaction events
   * @param nodeCount
   * @param edgeCount
   */
  static trackGraphLoaded(nodeCount: number, edgeCount: number): void {
    this.capture('graph_loaded', {
      graph_size: Math.min(nodeCount + edgeCount, 1000), // Cap for privacy
      interaction_type: 'navigate',
      feature_name: 'graph_visualization',
    });
  }

  /**
   * Track node selection in graphs
   * @param nodeType
   */
  static trackNodeSelected(nodeType: string): void {
    this.capture('node_selected', {
      node_type: nodeType as EntityTypeType,
      interaction_type: 'select',
      feature_name: 'graph_visualization',
    });
  }

  /**
   * Track filter application
   */
  static trackFilterApplied(): void {
    this.capture('filter_applied', {
      feature_name: 'relationship_filtering',
      interaction_type: 'filter',
    });
  }

  /**
   * Track relationship exploration
   * @param entityType
   */
  static trackRelationshipExplored(entityType: string): void {
    this.capture('relationship_explored', {
      entity_type: entityType as EntityTypeType,
      interaction_type: 'navigate',
      feature_name: 'relationship_filtering',
    });
  }

  /**
   * Track catalogue creation
   */
  static trackCatalogueCreated(): void {
    this.capture('catalogue_created', {
      feature_name: 'entity_catalogue',
    });
  }

  /**
   * Track bookmark addition
   * @param entityType
   */
  static trackBookmarkAdded(entityType: string): void {
    this.capture('bookmark_added', {
      entity_type: entityType as EntityTypeType,
      feature_name: 'bookmarking',
    });
  }

  /**
   * Track sharing functionality usage
   */
  static trackShareInitiated(): void {
    this.capture('share_initiated', {
      feature_name: 'sharing',
    });
  }

  /**
   * Track data export operations
   */
  static trackExportPerformed(): void {
    this.capture('export_performed', {
      feature_name: 'data_export',
    });
  }

  /**
   * Track citation network exploration
   */
  static trackCitationNetworkExplored(): void {
    this.capture('citation_network_explored', {
      feature_name: 'citation_network',
      research_phase: 'investigation',
    });
  }

  /**
   * Track author discovery events
   */
  static trackAuthorDiscovered(): void {
    this.capture('author_discovered', {
      feature_name: 'search',
      research_phase: 'discovery',
    });
  }

  /**
   * Track research workflow deepening
   * @param stepNumber
   */
  static trackInvestigationDeepened(stepNumber: number): void {
    this.capture('investigation_deepened', {
      workflow_step: Math.min(stepNumber, 10), // Cap for privacy
      research_phase: 'investigation',
    });
  }

  /**
   * Track research path following
   */
  static trackResearchPathFollowed(): void {
    this.capture('research_path_followed', {
      feature_name: 'search',
      research_phase: 'synthesis',
    });
  }

  /**
   * Track work funding relationships exploration
   */
  static trackWorkFundingRelationshipsExplored(): void {
    this.capture('relationship_explored', {
      entity_type: 'work',
      interaction_type: 'navigate',
      feature_name: 'relationship_filtering',
      research_phase: 'analysis',
    });
  }

  /**
   * Get entity category for analytics (privacy-safe grouping)
   * @param entityType
   */
  private static getEntityCategory(entityType: string): string {
    const workTypes = ['works'];
    const peopleTypes = ['authors'];
    const institutionTypes = ['institutions'];
    const publicationTypes = ['sources', 'publishers'];
    const researchTypes = ['topics', 'concepts'];
    const fundingTypes = ['funders'];
    const discoveryTypes = ['keywords'];

    if (workTypes.includes(entityType)) return 'academic_work';
    if (peopleTypes.includes(entityType)) return 'researcher';
    if (institutionTypes.includes(entityType)) return 'research_institution';
    if (publicationTypes.includes(entityType)) return 'publication_venue';
    if (researchTypes.includes(entityType)) return 'research_topic';
    if (fundingTypes.includes(entityType)) return 'funding_organization';
    if (discoveryTypes.includes(entityType)) return 'discovery_term';

    return 'other_entity';
  }

  /**
   * Get or create session ID for analytics
   */
  private static getSessionId(): string {
    const SESSION_KEY = 'bibgraph_analytics_session';

    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${crypto.randomUUID().slice(0, 11)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
  }

  /**
   * Identify user with anonymous ID for session tracking
   */
  static identifyAnonymousUser(): void {
    if (!this.posthogAvailable()) return;

    try {
      const posthog = (window as unknown as WindowWithPostHog).posthog;
      if (!posthog) return;

      // Generate anonymous user ID based on browser fingerprint (privacy-safe)
      const anonymousId = this.generateAnonymousId();
      posthog.identify(anonymousId, {
        user_type: 'anonymous_researcher',
        identified_at: new Date().toISOString(),
        user_agent_group: this.getUserAgentGroup(),
      });
    } catch (error) {
      console.warn('Failed to identify anonymous user:', error);
    }
  }

  /**
   * Generate privacy-safe anonymous user ID
   */
  private static generateAnonymousId(): string {
    // Create a hash from browser features (not fingerprinting for tracking, but for session consistency)
    const features = [
      navigator.userAgent?.slice(0, 100) || '', // Limited UA slice
      navigator.language || '',
      new Date().getTimezoneOffset().toString(),
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let index = 0; index < features.length; index++) {
      const char = features.charCodeAt(index);
      hash = ((hash << 5) - hash) + char;
      hash &= hash; // Convert to 32-bit integer
    }

    return `anon_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Reset user identification
   */
  static resetUser(): void {
    if (!this.posthogAvailable()) return;

    try {
      const posthog = (window as unknown as WindowWithPostHog).posthog;
      if (!posthog) return;

      posthog.reset();
      sessionStorage.removeItem('bibgraph_analytics_session');
    } catch (error) {
      console.warn('Failed to reset user identification:', error);
    }
  }
}

/**
 * Export AcademicAnalytics class for direct usage
 */
export { AcademicAnalytics };

/**
 * Hook for easy access to academic analytics in React components
 */
export const useAcademicAnalytics = () => ({
    trackSearchPerformed: AcademicAnalytics.trackSearchPerformed.bind(AcademicAnalytics),
    trackEntityView: AcademicAnalytics.trackEntityView.bind(AcademicAnalytics),
    trackGraphLoaded: AcademicAnalytics.trackGraphLoaded.bind(AcademicAnalytics),
    trackNodeSelected: AcademicAnalytics.trackNodeSelected.bind(AcademicAnalytics),
    trackFilterApplied: AcademicAnalytics.trackFilterApplied.bind(AcademicAnalytics),
    trackRelationshipExplored: AcademicAnalytics.trackRelationshipExplored.bind(AcademicAnalytics),
    trackCatalogueCreated: AcademicAnalytics.trackCatalogueCreated.bind(AcademicAnalytics),
    trackBookmarkAdded: AcademicAnalytics.trackBookmarkAdded.bind(AcademicAnalytics),
    trackShareInitiated: AcademicAnalytics.trackShareInitiated.bind(AcademicAnalytics),
    trackExportPerformed: AcademicAnalytics.trackExportPerformed.bind(AcademicAnalytics),
    trackCitationNetworkExplored: AcademicAnalytics.trackCitationNetworkExplored.bind(AcademicAnalytics),
    trackAuthorDiscovered: AcademicAnalytics.trackAuthorDiscovered.bind(AcademicAnalytics),
    trackInvestigationDeepened: AcademicAnalytics.trackInvestigationDeepened.bind(AcademicAnalytics),
    trackResearchPathFollowed: AcademicAnalytics.trackResearchPathFollowed.bind(AcademicAnalytics),
    trackWorkFundingRelationshipsExplored: AcademicAnalytics.trackWorkFundingRelationshipsExplored.bind(AcademicAnalytics),
    identifyAnonymousUser: AcademicAnalytics.identifyAnonymousUser.bind(AcademicAnalytics),
    resetUser: AcademicAnalytics.resetUser.bind(AcademicAnalytics),
  });