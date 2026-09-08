/**
 * React Router mocking utilities for TanStack Router testing
 * Provides consistent mocking patterns for router-dependent components
 */

import React from "react";
import { vi } from "vitest";

/**
 * Mock router with commonly used methods and properties
 * @param overrides
 */
export const createMockRouter = (overrides: Record<string, unknown> = {}): any => ({
  navigate: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  invalidate: vi.fn(),
  load: vi.fn(),
  preload: vi.fn(),
  buildLocation: vi.fn(),
  buildHref: vi.fn(),
  state: {
    location: {
      pathname: "/",
      search: "",
      hash: "",
      href: "/",
      state: undefined,
      maskedLocation: undefined,
    },
    resolvedLocation: {
      pathname: "/",
      search: "",
      hash: "",
      href: "/",
    },
    status: "idle" as const,
    isFetching: false,
    isLoading: false,
    isTransitioning: false,
  },
  history: {
    length: 1,
    action: "POP" as const,
    location: {
      pathname: "/",
      search: "",
      hash: "",
      state: undefined,
      key: "default",
    },
    listen: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    createHref: vi.fn(),
  },
  ...overrides,
});

/**
 * Mock navigation context for TanStack Router
 * @param overrides
 */
export const createMockNavigation = (
  overrides: Record<string, unknown> = {},
): any => ({
  navigate: vi.fn(),
  buildLocation: vi.fn(),
  ...overrides,
});

/**
 * Mock route context for specific routes
 * @param routeId
 * @param params
 */
export const createMockRouteContext = (
  routeId: string,
  params: Record<string, string> = {},
) => ({
  routeId,
  params,
  search: {},
  loaderData: {},
  actionData: undefined,
  routeSearch: {},
  routeParams: params,
  pathname: `/${Object.values(params).join("/")}`,
  href: `/${Object.values(params).join("/")}`,
});

/**
 * Mock match object for route matching
 * @param overrides
 */
export const createMockMatch = (overrides: Record<string, unknown> = {}): any => ({
  id: "test-route",
  params: {},
  pathname: "/",
  search: {},
  hash: "",
  fullPath: "/",
  state: undefined,
  staticData: undefined,
  loaderData: undefined,
  actionData: undefined,
  error: undefined,
  status: "success" as const,
  isFetching: false,
  invalidAt: Infinity,
  preload: vi.fn(),
  ...overrides,
});

/**
 * Higher-order component to wrap components with mock router context
 * @param Component
 * @param routerOptions
 * @param routerOptions.pathname
 * @param routerOptions.search
 * @param routerOptions.params
 * @param routerOptions.navigate
 */
export const withMockRouter = <P extends Record<string, unknown>>(Component: React.ComponentType<P>, routerOptions?: {
    pathname?: string;
    search?: string;
    params?: Record<string, string>;
    navigate?: typeof vi.fn;
  }) => (properties: P) => {
    const mockRouter = createMockRouter({
      state: {
        location: {
          pathname: routerOptions?.pathname || "/",
          search: routerOptions?.search || "",
          hash: "",
          href:
            (routerOptions?.pathname || "/") + (routerOptions?.search || ""),
          state: undefined,
          maskedLocation: undefined,
        },
        resolvedLocation: {
          pathname: routerOptions?.pathname || "/",
          search: routerOptions?.search || "",
          hash: "",
          href:
            (routerOptions?.pathname || "/") + (routerOptions?.search || ""),
        },
        status: "idle" as const,
        isFetching: false,
        isLoading: false,
        isTransitioning: false,
      },
      navigate: routerOptions?.navigate || vi.fn(),
    });

    // Mock the router context
    React.useContext = vi.fn().mockReturnValue(mockRouter);

    return React.createElement(Component, properties);
  };

/**
 * Mock TanStack Router hooks for testing
 */
export const mockRouterHooks: any = {
  useRouter: () => createMockRouter(),
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    pathname: "/",
    search: "",
    hash: "",
    href: "/",
    state: undefined,
    maskedLocation: undefined,
  }),
  useParams: () => ({}),
  useSearch: () => ({}),
  useMatches: () => [createMockMatch()],
  useMatch: () => createMockMatch(),
  useRouteContext: () => ({}),
  useLoaderData: () => {},
  useRouterState: () => ({
    status: "idle" as const,
    isFetching: false,
    isLoading: false,
    isTransitioning: false,
    location: {
      pathname: "/",
      search: "",
      hash: "",
      href: "/",
      state: undefined,
      maskedLocation: undefined,
    },
    resolvedLocation: {
      pathname: "/",
      search: "",
      hash: "",
      href: "/",
    },
  }),
};

/**
 * Setup function to mock all TanStack Router modules
 * Call this in your test setup to mock router dependencies
 */
export const setupRouterMocks = () => {
  // Mock @tanstack/react-router with vi.mock (top-level mocking)
  vi.mock("@tanstack/react-router", async () => {
    const actual = await vi.importActual("@tanstack/react-router");
    return {
      ...actual,
      ...mockRouterHooks,
      Link: ({ children, to, ...properties }: React.PropsWithChildren<{ to: string } & Record<string, unknown>>) =>
        React.createElement("a", { href: to, ...properties }, children),
      Outlet: ({ ...properties }: Record<string, unknown>) =>
        React.createElement("div", {
          "data-testid": "router-outlet",
          ...properties,
        }),
      Navigate: ({ to }: { to: string }) =>
        React.createElement("div", {
          "data-testid": "navigate",
          "data-to": to,
        }),
      createRouter: vi.fn(() => createMockRouter()),
      createRootRoute: vi.fn(),
      createRoute: vi.fn(),
      createFileRoute: vi.fn((path: string) => (options?: Record<string, unknown>) => {
        const route = {
          path,
          options: options || {},
          ...options,
        };
        return route;
      }),
      RouterProvider: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => children,
      useRouterState: () => ({
        status: "idle" as const,
        isFetching: false,
        isLoading: false,
        isTransitioning: false,
        location: {
          pathname: "/",
          search: "",
          hash: "",
          href: "/",
          state: undefined,
          maskedLocation: undefined,
        },
        resolvedLocation: {
          pathname: "/",
          search: "",
          hash: "",
          href: "/",
        },
      }),
      useRouter: () => createMockRouter(),
      useNavigate: () => vi.fn(),
      useLocation: () => ({
        pathname: "/",
        search: "",
        hash: "",
        href: "/",
        state: undefined,
        maskedLocation: undefined,
      }),
      useParams: () => ({}),
      useSearch: () => ({}),
      useMatches: () => [createMockMatch()],
      useMatch: () => createMockMatch(),
      useRouteContext: () => ({}),
      useLoaderData: () => {},
    };
  });

  // Mock specific router components used in the app
  vi.mock("@/lib/router", () => ({
    router: createMockRouter(),
  }));
};

/**
 * Reset all router mocks to their initial state
 */
export const resetRouterMocks = () => {
  for (const hook of Object.values(mockRouterHooks)) {
    if (typeof hook === "function" && "mockReset" in hook) {
      (hook as { mockReset: () => void }).mockReset();
    }
  }
};
