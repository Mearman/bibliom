/**
 * Shared store mocking utilities for testing
 * Provides consistent mocking patterns for React Context stores
 */

import React from "react";
import { vi } from "vitest";

/**
 * Creates a mock Zustand store for testing
 * Provides a consistent way to mock store state and actions
 * @param initialState
 */
export const createMockStore = <T extends Record<string, unknown>>(initialState: Partial<T> = {}): T & {
  __mockReset: () => void;
  __mockUpdate: (update: Partial<T>) => void;
} => {
  const state = { ...initialState } as T;

  const mockStore = new Proxy(state, {
    get: (target, property) => {
      if (property === "__mockReset") {
        return () => {
          for (const key of Object.keys(target)) {
            delete (target as Record<string, unknown>)[key];
          }
          Object.assign(target, initialState);
        };
      }

      if (property === "__mockUpdate") {
        return (update: Partial<T>) => {
          Object.assign(target, update);
        };
      }

      return target[property as keyof T];
    },
    set: (target, property, value) => {
      (target as Record<string, unknown>)[property as string] = value;
      return true;
    },
  });

  return mockStore as T & {
    __mockReset: () => void;
    __mockUpdate: (update: Partial<T>) => void;
  };
};


/**
 * Mock layout store with common test state
 */
export const createMockLayoutStore = (): any =>
  createMockStore({
    animationEnabled: true,
    autoLayout: false,
    layoutType: "d3-force" as const,
    isRunning: false,
    iterations: 0,
    maxIterations: 100,
    toggleAnimation: vi.fn(),
    setAutoLayout: vi.fn(),
    setLayoutType: vi.fn(),
    startLayout: vi.fn(),
    stopLayout: vi.fn(),
    resetLayout: vi.fn(),
  });

/**
 * Mock settings store with common test state
 */
export const createMockSettingsStore = (): any =>
  createMockStore({
    theme: "light" as const,
    language: "en",
    autoSave: true,
    enableNotifications: true,
    setTheme: vi.fn(),
    setLanguage: vi.fn(),
    setAutoSave: vi.fn(),
    setEnableNotifications: vi.fn(),
    resetSettings: vi.fn(),
  });

/**
 * Mock expansion settings store with common test state
 */
export const createMockExpansionSettingsStore = (): any =>
  createMockStore({
    maxDepth: 2,
    maxNodes: 100,
    enableAutoExpansion: false,
    expansionDelay: 1000,
    setMaxDepth: vi.fn(),
    setMaxNodes: vi.fn(),
    setEnableAutoExpansion: vi.fn(),
    setExpansionDelay: vi.fn(),
    resetToDefaults: vi.fn(),
  });

/**
 * Utility to mock a store module completely
 * Use this to replace entire store modules in tests
 * @param storeName
 * @param mockStore
 */
export const mockStoreModule = <T>(storeName: string, mockStore: T): void => {
  vi.doMock(`@/stores/${storeName}`, () => ({
    [`use${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`]: () =>
      mockStore,
  }));
};

/**
 * Higher-order function to create store test wrapper
 * Provides consistent store mocking setup for component tests
 * @param Component
 * @param stores
 * @param stores.layoutStore
 * @param stores.settingsStore
 * @param stores.expansionSettingsStore
 */
export const withMockStores = <P extends Record<string, unknown>>(Component: React.ComponentType<P>, stores?: {
    layoutStore?: ReturnType<typeof createMockLayoutStore>;
    settingsStore?: ReturnType<typeof createMockSettingsStore>;
    expansionSettingsStore?: ReturnType<
      typeof createMockExpansionSettingsStore
    >;
  }) => (properties: P) => {
    // Mock stores before rendering
    if (stores?.layoutStore) {
      vi.doMock("@/stores/layout-store", () => ({
        useLayoutStore: () => stores.layoutStore,
      }));
    }

    if (stores?.settingsStore) {
      vi.doMock("@/stores/settings-store", () => ({
        useSettingsStore: () => stores.settingsStore,
      }));
    }

    if (stores?.expansionSettingsStore) {
      vi.doMock("@/stores/expansion-settings-store", () => ({
        useExpansionSettingsStore: () => stores.expansionSettingsStore,
      }));
    }

    return React.createElement(Component, properties);
  };

/**
 * Reset all mocked stores to their initial state
 * Call this in beforeEach to ensure clean test state
 * @param stores
 */
export const resetMockStores = (...stores: Array<{ __mockReset: () => void }>) => {
  for (const store of stores) store.__mockReset();
};
