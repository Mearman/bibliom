/**
 * MSW server setup for testing environments
 * Configures Mock Service Worker for Node.js test environments
 */

import { setupServer } from "msw/node";

import { openalexHandlers } from "./handlers";

/**
 * MSW server instance for Node.js test environments
 * Used in component, integration, and e2e tests
 */
export const server = setupServer(...openalexHandlers);

/**
 * Start MSW server before all tests
 */
export const startMockServer = () => {
  server.listen({
    onUnhandledRequest: (request, print) => {
      // Only warn for actual external requests, not internal ones
      const url = new URL(request.url);
      if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
        print.warning();
      }
    },
  });
};

/**
 * Stop MSW server after all tests
 */
export const stopMockServer = () => {
  server.close();
};

/**
 * Reset handlers between tests
 */
export const resetMockServer = () => {
  server.resetHandlers();

  // Re-add default handlers to ensure clean state
  server.use(...openalexHandlers);
};
