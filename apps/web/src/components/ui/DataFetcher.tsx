/**
 * Data Fetcher Component
 *
 * Provides a unified component for data fetching operations with integrated
 * error handling, loading states, and toast notifications. Improves both
 * user experience and developer experience by standardizing common patterns.
 */

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { ErrorBoundary } from "./ErrorBoundary";
import { CardSkeleton, GraphSkeleton, ListSkeleton, StatsSkeleton } from "./LoadingSkeleton";
import { useToast } from "./ToastNotification";

export interface DataFetcherConfig<T> {
  /**
  Function to fetch data
   */
  fetchFn: () => Promise<T>;
  /**
  Dependencies that should trigger refetch
   */
  deps?: unknown[];
  /**
  Initial data to use before first fetch
   */
  initialData?: T;
  /**
  Whether to fetch on mount
   */
  fetchOnMount?: boolean;
  /**
  Custom error message for display
   */
  errorMessage?: string;
  /**
  Custom loading message
   */
  loadingMessage?: string;
  /**
  Whether to show success toast on fetch
   */
  showSuccessToast?: boolean;
  /**
  Success toast message
   */
  successMessage?: string;
  /**
  Whether to show error toast on failure
   */
  showErrorToast?: boolean;
  /**
  Whether to show retry status in toasts
   */
  showRetryStatus?: boolean;
  /**
  Retry configuration
   */
  retry?: {
    maxAttempts: number;
    delay: number;
    backoffMultiplier?: number;
  };
  /**
  Loading skeleton type
   */
  skeletonType?: "text" | "card" | "list" | "table" | "graph" | "stats";
  /**
  Number of skeleton items to show
   */
  skeletonCount?: number;
  /**
  Custom loading component
   */
  loadingComponent?: ReactNode;
  /**
  Custom error component
   */
  errorComponent?: ReactNode;
  /**
  Custom empty component
   */
  emptyComponent?: ReactNode;
  /**
  Function to determine if data is empty
   */
  isEmpty?: (data: T) => boolean;
}

export interface DataFetcherProps<T> {
  /**
  Configuration object
   */
  config: DataFetcherConfig<T>;
  /**
  Render function with data state
   */
  children: (state: {
    data: T | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    retryCount: number;
  }) => ReactNode;
}

/**
 * Hook for data fetching with integrated error handling and toasts
 * @param config
 */
export const useDataFetcher = <T,>(config: DataFetcherConfig<T>) => {
  const toast = useToast();
  const [data, setData] = useState<T | undefined>(config.initialData);
  const [loading, setLoading] = useState(config.fetchOnMount ?? true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const executeFetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await config.fetchFn();
      setData(result);

      // Show success toast if enabled
      if (config.showSuccessToast && retryCount === 0) {
        toast.success(config.successMessage || "Data loaded successfully");
      }

      setRetryCount(0);
      return result;
    } catch (error_) {
      const errorObject = error_ instanceof Error ? error_ : new Error("Unknown error occurred");
      setError(errorObject);

      // Show error toast if enabled
      if (config.showErrorToast) {
        toast.error(config.errorMessage || errorObject.message);
      }

      // Handle retry logic with enhanced visibility
      if (config.retry && retryCount < config.retry.maxAttempts) {
        const nextRetryCount = retryCount + 1;
        const backoffMultiplier = config.retry.backoffMultiplier || 1;
        const delay = config.retry.delay * Math.pow(backoffMultiplier, retryCount);

        setRetryCount(nextRetryCount);

        // Show retry status toast if enabled
        if (config.showRetryStatus) {
          const remainingAttempts = config.retry.maxAttempts - nextRetryCount;
          toast.info(
            `Retrying... Attempt ${nextRetryCount} of ${config.retry.maxAttempts} (${remainingAttempts} remaining)`,
            { autoClose: delay }
          );
        }

        setTimeout(() => {
          executeFetch();
        }, delay);
      } else if (config.retry && retryCount >= config.retry.maxAttempts && config.showErrorToast) {
        // Show final failure message when all retries exhausted
        toast.error(
          config.errorMessage || `Failed after ${config.retry.maxAttempts} attempts. Please try again later.`
        );
      }

      throw errorObject;
    } finally {
      setLoading(false);
    }
  }, [config, toast, retryCount]);

  const refetch = useCallback(async () => {
    setRetryCount(0);
    await executeFetch();
  }, [executeFetch]);

  useEffect(() => {
    if (config.fetchOnMount !== false) {
      executeFetch();
    }
  }, [executeFetch, ...(config.deps || [])]);

  return {
    data,
    loading,
    error,
    refetch,
    retryCount,
  };
};;

/**
 * Data Fetcher Component that provides integrated UI and state management
 * @param root0
 * @param root0.config
 * @param root0.children
 */
export const DataFetcher = <T,>({ config, children }: DataFetcherProps<T>) => {
  const { data, loading, error, refetch, retryCount } = useDataFetcher(config);

  // Check if data is empty
  const isEmpty = config.isEmpty ? (data !== undefined && config.isEmpty(data)) : !data;

  // Handle loading state
  if (loading) {
    if (config.loadingComponent) {
      return <>{config.loadingComponent}</>;
    }

    const SkeletonComponent = {
      card: CardSkeleton,
      list: ListSkeleton,
      graph: GraphSkeleton,
      stats: StatsSkeleton,
      text: ListSkeleton,
      table: ListSkeleton,
    }[config.skeletonType || "card"] || CardSkeleton;

    if (config.skeletonType === "list" || config.skeletonType === "text" || config.skeletonType === "table") {
      return <SkeletonComponent items={config.skeletonCount || 3} />;
    }
    return <SkeletonComponent />;
  }

  // Handle error state
  if (error && !config.retry?.maxAttempts) {
    if (config.errorComponent) {
      return <>{config.errorComponent}</>;
    }

    return (
      <ErrorBoundary
        showRetry={true}
        title="Data Loading Error"
        description={config.errorMessage || error.message}
        onError={() => refetch()}
      >
        <div>Failed to load data</div>
      </ErrorBoundary>
    );
  }

  // Handle empty state
  if (isEmpty && !loading && !error && config.emptyComponent) {
      return <>{config.emptyComponent}</>;
    }

  // Render children with state
  return <>{children({ data, loading, error, refetch, retryCount })}</>;
};;

/**
 * Specialized fetcher for API responses with count and results
 * @param fetchFn
 * @param options
 * @param options.initialPage
 * @param options.perPage
 * @param options.autoFetch
 */
export const usePaginatedFetcher = <T,>(fetchFn: (page?: number, perPage?: number) => Promise<{
    results: T[];
    count: number;
    page?: number;
    perPage?: number;
  }>, options?: {
    initialPage?: number;
    perPage?: number;
    autoFetch?: boolean;
  }) => {
  const [page, setPage] = useState(options?.initialPage || 1);
  const [perPage, setPerPage] = useState(options?.perPage || 25);
  const [pagination, setPagination] = useState<{
    results: T[];
    count: number;
    page?: number;
    perPage?: number;
  }>({
    results: [],
    count: 0,
    page: 1,
    perPage: 25,
  });

  const { loading, error, refetch } = useDataFetcher({
    fetchFn: () => fetchFn(page, perPage),
    deps: [page, perPage],
    fetchOnMount: options?.autoFetch !== false,
    showSuccessToast: false,
    showErrorToast: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchFn(page, perPage);
        setPagination(result);
      } catch {
        // Error handled by useDataFetcher
      }
    };

    if (options?.autoFetch !== false) {
      loadData();
    }
  }, [page, perPage, fetchFn, options?.autoFetch]);

  const nextPage = () => setPage((previous) => previous + 1);
  const previousPage = () => setPage((previous) => Math.max(1, previous - 1));
  const goToPage = (newPage: number) => setPage(Math.max(1, newPage));
  const changePerPage = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1); // Reset to first page
  };

  return {
    data: pagination.results,
    count: pagination.count,
    page,
    perPage,
    totalPages: Math.ceil(pagination.count / perPage),
    loading,
    error,
    refetch,
    nextPage,
    prevPage: previousPage,
    goToPage,
    changePerPage,
    hasNextPage: page * perPage < pagination.count,
    hasPrevPage: page > 1,
  };
};;

/**
 * Higher-order component for adding data fetching to existing components
 * @param Component
 * @param config
 */
export const withDataFetching = <P,>(Component: React.ComponentType<P>, config: DataFetcherConfig<unknown>) => {
  const WrappedComponent = (properties: Omit<P, keyof ReturnType<typeof useDataFetcher>>) => {
    return (
      <DataFetcher config={config}>
        {(state) => <Component {...(properties as P)} {...state} />}
      </DataFetcher>
    );
  };

  WrappedComponent.displayName = `withDataFetching(${Component.displayName || Component.name})`;
  return WrappedComponent;
};;

/**
 * Predefined configurations for common use cases
 */
export const DataFetcherConfigs = {
  /**
  Configuration for entity list fetching
   */
  entityList: {
    skeletonType: "list" as const,
    skeletonCount: 5,
    showSuccessToast: false,
    showErrorToast: true,
    showRetryStatus: true,
    retry: {
      maxAttempts: 3,
      delay: 1000,
      backoffMultiplier: 1.5,
    },
  },

  /**
  Configuration for search results
   */
  search: {
    skeletonType: "card" as const,
    skeletonCount: 6,
    showSuccessToast: false,
    showErrorToast: true,
    showRetryStatus: true,
    errorMessage: "Search failed. Please try again.",
    retry: {
      maxAttempts: 2,
      delay: 800,
      backoffMultiplier: 2,
    },
  },

  /**
  Configuration for entity details
   */
  entityDetails: {
    skeletonType: "card" as const,
    skeletonCount: 1,
    showSuccessToast: false,
    showErrorToast: true,
    showRetryStatus: true,
    retry: {
      maxAttempts: 2,
      delay: 500,
      backoffMultiplier: 1.5,
    },
  },

  /**
  Configuration for graph data
   */
  graphData: {
    skeletonType: "graph" as const,
    skeletonCount: 1,
    showSuccessToast: true,
    successMessage: "Graph data loaded successfully",
    showErrorToast: true,
    showRetryStatus: true,
    retry: {
      maxAttempts: 2,
      delay: 2000,
      backoffMultiplier: 1.2,
    },
  },
} as const;

