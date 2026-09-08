/**
 * Search state renderer components (empty, loading, error, no results)
 */
import { ErrorRecovery, SearchEmptyState } from "@bibgraph/ui";

import { SearchResultsSkeleton } from "./SearchResultsSkeleton";

interface EmptyStateProperties {
  onQuickSearch?: (query: string) => void;
}

export const SearchEmptyStateRenderer = ({ onQuickSearch }: EmptyStateProperties) => (
  <SearchEmptyState
    variant="initial"
    onQuickSearch={onQuickSearch}
  />
);

export const SearchLoadingStateRenderer = () => (
  <SearchResultsSkeleton
    viewType="table"
    items={8}
    title="Searching OpenAlex database..."
  />
);

interface ErrorStateProperties {
  error: unknown;
  onRetry: () => void;
  onRetryWithExponentialBackoff: () => void;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
}

export const SearchErrorStateRenderer = ({
  error,
  onRetry,
  onRetryWithExponentialBackoff,
  retryCount,
  maxRetries,
  isRetrying,
}: ErrorStateProperties) => (
  <ErrorRecovery
    error={error}
    onRetry={onRetry}
    onRetryWithExponentialBackoff={onRetryWithExponentialBackoff}
    retryCount={retryCount}
    maxRetries={maxRetries}
    isRetrying={isRetrying}
    context={{
      operation: "Search Academic Database",
      entity: "OpenAlex Search"
    }}
  />
);

interface NoResultsStateProperties {
  query: string;
  onQuickSearch?: (query: string) => void;
}

export const SearchNoResultsStateRenderer = ({ query, onQuickSearch }: NoResultsStateProperties) => (
  <SearchEmptyState
    variant="no-results"
    query={query}
    onQuickSearch={onQuickSearch}
  />
);
