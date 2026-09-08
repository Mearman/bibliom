/**
 * OpenAlex Text Analysis API Entity Methods
 * Provides comprehensive methods for analyzing text content using OpenAlex's aboutness assignments
 */

import type { OpenAlexId, QueryParams } from "@bibgraph/types";

import type { OpenAlexBaseClient } from "../client";

/**
 * Options for text analysis requests
 */
export interface TextAnalysisOptions {
  /**
  The text title to analyze (required, 20-2000 characters)
   */
  title: string;
  /**
  Optional abstract to provide additional context
   */
  abstract?: string;
  /**
  Output format (defaults to json)
   */
  format?: "json";
}

/**
 * Base interface for text analysis entities
 */
export interface TextAnalysisEntity {
  /**
  OpenAlex ID of the entity
   */
  id: OpenAlexId;
  /**
  Display name of the entity
   */
  display_name: string;
  /**
  Relevance/confidence score
   */
  score: number;
}

/**
 * Keyword entity from text analysis
 */
export type TextAnalysisKeyword = TextAnalysisEntity;

/**
 * Topic entity from text analysis
 */
export interface TextAnalysisTopic extends TextAnalysisEntity {
  /**
  Topic level in the hierarchy
   */
  level?: number;
  /**
  Parent topic information
   */
  subfield?: {
    id: OpenAlexId;
    display_name: string;
  };
  field?: {
    id: OpenAlexId;
    display_name: string;
  };
  domain?: {
    id: OpenAlexId;
    display_name: string;
  };
}

/**
 * Concept entity from text analysis
 */
export interface TextAnalysisConcept extends TextAnalysisEntity {
  /**
  Concept level in the hierarchy (0-5)
   */
  level: number;
  /**
  Wikidata ID if available
   */
  wikidata?: string;
}

/**
 * Response from the combined text analysis endpoint
 */
export interface TextAnalysisResponse {
  /**
  Array of extracted keywords
   */
  keywords: TextAnalysisKeyword[];
  /**
  Array of identified topics
   */
  topics: TextAnalysisTopic[];
  /**
  Array of detected concepts
   */
  concepts: TextAnalysisConcept[];
  /**
  Metadata about the analysis
   */
  meta?: {
    /**
    Number of keywords found
     */
    keywords_count: number;
    /**
    Number of topics found
     */
    topics_count: number;
    /**
    Number of concepts found
     */
    concepts_count: number;
    /**
    Processing time in milliseconds
     */
    processing_time_ms?: number;
  };
}

/**
 * Response from individual analysis endpoints (if needed for future use)
 * Currently the endpoints return arrays directly, but keeping these types
 * in case the API structure changes
 */
export interface KeywordsResponse {
  /**
  Array of extracted keywords
   */
  results: TextAnalysisKeyword[];
  /**
  Metadata about keyword extraction
   */
  meta?: {
    count: number;
    processing_time_ms?: number;
  };
}

export interface TopicsResponse {
  /**
  Array of identified topics
   */
  results: TextAnalysisTopic[];
  /**
  Metadata about topic identification
   */
  meta?: {
    count: number;
    processing_time_ms?: number;
  };
}

export interface ConceptsResponse {
  /**
  Array of detected concepts
   */
  results: TextAnalysisConcept[];
  /**
  Metadata about concept detection
   */
  meta?: {
    count: number;
    processing_time_ms?: number;
  };
}

/**
 * Text Analysis API class providing comprehensive methods for analyzing text content
 */
export class TextAnalysisApi {
  constructor(private client: OpenAlexBaseClient) {}

  /**
   * Validate text analysis options
   * @param options
   */
  private validateOptions(options: TextAnalysisOptions): void {
    const titleLength = options.title.length;
    if (titleLength < 20 || titleLength > 2000) {
      throw new Error(`Title must be between 20-2000 characters (current: ${titleLength})`);
    }

    if (options.abstract && options.abstract.length > 5000) {
      throw new Error(`Abstract must be less than 5000 characters (current: ${options.abstract.length})`);
    }
  }

  /**
   * Build query parameters for text analysis requests
   * @param options
   */
  private buildParams(options: TextAnalysisOptions): QueryParams {
    this.validateOptions(options);

    const parameters: QueryParams = {
      title: options.title,
    };

    if (options.abstract) {
      parameters.abstract = options.abstract;
    }

    if (options.format) {
      parameters.format = options.format;
    }

    return parameters;
  }

  /**
   * Analyze text and return keywords, topics, and concepts
   * @param options - Text analysis options including title and optional abstract
   * @returns Promise resolving to complete text analysis results
   * @example
   * ```typescript
   * const analysis = await textAnalysisApi.analyzeText({
   *   title: 'Machine learning approaches for drug discovery in oncology',
   *   abstract: 'This paper explores novel computational methods...'
   * });
   *
   * console.log('Keywords:', analysis.keywords);
   * console.log('Topics:', analysis.topics);
   * console.log('Concepts:', analysis.concepts);
   * ```
   */
  async analyzeText(options: TextAnalysisOptions): Promise<TextAnalysisResponse> {
    const parameters = this.buildParams(options);
    return await this.client.get<TextAnalysisResponse>("text", parameters);
  }

  /**
   * Analyze text and return keywords, topics, and concepts (alias for analyzeText)
   * @param options - Text analysis options including title and optional abstract
   * @returns Promise resolving to complete text analysis results
   */
  async getText(options: TextAnalysisOptions): Promise<TextAnalysisResponse> {
    return this.analyzeText(options);
  }

  /**
   * Extract keywords from text content
   * @param options - Text analysis options including title and optional abstract
   * @returns Promise resolving to keyword analysis results
   * @example
   * ```typescript
   * const keywords = await textAnalysisApi.getKeywords({
   *   title: 'Deep learning for medical image analysis'
   * });
   *
   * keywords.forEach(keyword => {
   *   console.log(`${keyword.display_name}: ${keyword.score}`);
   * });
   * ```
   */
  async getKeywords(options: TextAnalysisOptions): Promise<TextAnalysisKeyword[]> {
    const parameters = this.buildParams(options);
    return await this.client.get<TextAnalysisKeyword[]>("text/keywords", parameters);
  }

  /**
   * Identify topics from text content
   * @param options - Text analysis options including title and optional abstract
   * @returns Promise resolving to topic analysis results
   * @example
   * ```typescript
   * const topics = await textAnalysisApi.getTopics({
   *   title: 'Sustainable energy systems and renewable technologies',
   *   abstract: 'An analysis of current trends in sustainable energy...'
   * });
   *
   * topics.forEach(topic => {
   *   console.log(`Topic: ${topic.display_name} (Score: ${topic.score})`);
   *   if (topic.field) {
   *     console.log(`Field: ${topic.field.display_name}`);
   *   }
   * });
   * ```
   */
  async getTopics(options: TextAnalysisOptions): Promise<TextAnalysisTopic[]> {
    const parameters = this.buildParams(options);
    return await this.client.get<TextAnalysisTopic[]>("text/topics", parameters);
  }

  /**
   * Detect concepts from text content
   * @param options - Text analysis options including title and optional abstract
   * @returns Promise resolving to concept analysis results
   * @example
   * ```typescript
   * const concepts = await textAnalysisApi.getConcepts({
   *   title: 'Quantum computing applications in cryptography'
   * });
   *
   * concepts.forEach(concept => {
   *   console.log(`${concept.display_name} (Level ${concept.level}): ${concept.score}`);
   *   if (concept.wikidata) {
   *     console.log(`Wikidata: ${concept.wikidata}`);
   *   }
   * });
   * ```
   */
  async getConcepts(options: TextAnalysisOptions): Promise<TextAnalysisConcept[]> {
    const parameters = this.buildParams(options);
    return await this.client.get<TextAnalysisConcept[]>("text/concepts", parameters);
  }

  /**
   * Analyze text and return only keywords with scores above threshold
   * @param options - Text analysis options
   * @param minScore - Minimum score threshold (0-1)
   * @returns Promise resolving to filtered keywords
   * @example
   * ```typescript
   * const relevantKeywords = await textAnalysisApi.getRelevantKeywords({
   *   title: 'Artificial intelligence in healthcare diagnostics'
   * }, 0.5);
   * ```
   */
  async getRelevantKeywords(
    options: TextAnalysisOptions,
    minScore: number = 0.3
  ): Promise<TextAnalysisKeyword[]> {
    const keywords = await this.getKeywords(options);
    return keywords.filter(keyword => keyword.score >= minScore);
  }

  /**
   * Analyze text and return only topics with scores above threshold
   * @param options - Text analysis options
   * @param minScore - Minimum score threshold (0-1)
   * @returns Promise resolving to filtered topics
   * @example
   * ```typescript
   * const relevantTopics = await textAnalysisApi.getRelevantTopics({
   *   title: 'Climate change impact on biodiversity'
   * }, 0.4);
   * ```
   */
  async getRelevantTopics(
    options: TextAnalysisOptions,
    minScore: number = 0.3
  ): Promise<TextAnalysisTopic[]> {
    const topics = await this.getTopics(options);
    return topics.filter(topic => topic.score >= minScore);
  }

  /**
   * Analyze text and return only concepts with scores above threshold
   * @param options - Text analysis options
   * @param minScore - Minimum score threshold (0-1)
   * @returns Promise resolving to filtered concepts
   * @example
   * ```typescript
   * const relevantConcepts = await textAnalysisApi.getRelevantConcepts({
   *   title: 'Blockchain technology for supply chain management'
   * }, 0.5);
   * ```
   */
  async getRelevantConcepts(
    options: TextAnalysisOptions,
    minScore: number = 0.3
  ): Promise<TextAnalysisConcept[]> {
    const concepts = await this.getConcepts(options);
    return concepts.filter(concept => concept.score >= minScore);
  }

  /**
   * Get the most relevant single result from each analysis type
   * @param options - Text analysis options
   * @returns Promise resolving to top results from each category
   * @example
   * ```typescript
   * const topResults = await textAnalysisApi.getTopResults({
   *   title: 'Neural networks for natural language processing'
   * });
   *
   * if (topResults.topKeyword) {
   *   console.log('Top keyword:', topResults.topKeyword.display_name);
   * }
   * ```
   */
  async getTopResults(options: TextAnalysisOptions): Promise<{
    topKeyword?: TextAnalysisKeyword;
    topTopic?: TextAnalysisTopic;
    topConcept?: TextAnalysisConcept;
  }> {
    const [keywords, topics, concepts] = await Promise.all([
      this.getKeywords(options),
      this.getTopics(options),
      this.getConcepts(options)
    ]);

    return {
      topKeyword: keywords.length > 0 ? keywords[0] : undefined,
      topTopic: topics.length > 0 ? topics[0] : undefined,
      topConcept: concepts.length > 0 ? concepts[0] : undefined,
    };
  }

  /**
   * Get comprehensive analysis with summary statistics
   * @param options - Text analysis options
   * @returns Promise resolving to detailed analysis with statistics
   * @example
   * ```typescript
   * const analysis = await textAnalysisApi.getDetailedAnalysis({
   *   title: 'Computational biology methods for protein structure prediction'
   * });
   *
   * console.log(`Found ${analysis.summary.totalEntities} entities`);
   * console.log(`Average score: ${analysis.summary.averageScore}`);
   * ```
   */
  async getDetailedAnalysis(options: TextAnalysisOptions): Promise<{
    keywords: TextAnalysisKeyword[];
    topics: TextAnalysisTopic[];
    concepts: TextAnalysisConcept[];
    summary: {
      totalEntities: number;
      averageScore: number;
      topKeyword?: TextAnalysisKeyword;
      topTopic?: TextAnalysisTopic;
      topConcept?: TextAnalysisConcept;
      scoreDistribution: {
        high: number; // score >= 0.7
        medium: number; // 0.3 <= score < 0.7
        low: number; // score < 0.3
      };
    };
  }> {
    const [keywords, topics, concepts] = await Promise.all([
      this.getKeywords(options),
      this.getTopics(options),
      this.getConcepts(options)
    ]);

    const allEntities = [...keywords, ...topics, ...concepts];
    const totalEntities = allEntities.length;
    const averageScore = totalEntities > 0
      ? allEntities.reduce((sum, entity) => sum + entity.score, 0) / totalEntities
      : 0;

    const scoreDistribution = allEntities.reduce(
      (distribution, entity) => {
        if (entity.score >= 0.7) distribution.high++;
        else if (entity.score >= 0.3) distribution.medium++;
        else distribution.low++;
        return distribution;
      },
      { high: 0, medium: 0, low: 0 }
    );

    return {
      keywords,
      topics,
      concepts,
      summary: {
        totalEntities,
        averageScore,
        topKeyword: keywords.length > 0 ? keywords[0] : undefined,
        topTopic: topics.length > 0 ? topics[0] : undefined,
        topConcept: concepts.length > 0 ? concepts[0] : undefined,
        scoreDistribution,
      },
    };
  }
}