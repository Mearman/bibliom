/**
 * Settings store for application configuration
 * Direct Dexie implementation without Zustand compatibility
 * Manages user settings with IndexedDB persistence
 */

import { logger } from "@bibgraph/utils/logger";
import Dexie, { type Table } from "dexie";

// Database schema
interface SettingsRecord {
  id?: number;
  key: string;
  value: string;
  updatedAt: Date;
}

// Dexie database class
class SettingsDB extends Dexie {
  settings!: Table<SettingsRecord>;

  constructor() {
    super("bibgraph-settings");

    this.version(1).stores({
      settings: "++id, key, updatedAt",
    });
  }
}

// Singleton instance
let databaseInstance: SettingsDB | null = null;

const getDB = (): SettingsDB => {
  databaseInstance ??= new SettingsDB();
  return databaseInstance;
};

// Background strategy type (matches @bibgraph/utils BackgroundStrategy)
type BackgroundStrategy = 'idle' | 'scheduler' | 'worker' | 'sync';

const VALID_BACKGROUND_STRATEGIES = new Set<BackgroundStrategy>(['idle', 'scheduler', 'worker', 'sync']);

const isBackgroundStrategy = (value: unknown): value is BackgroundStrategy => typeof value === 'string' && VALID_BACKGROUND_STRATEGIES.has(value as BackgroundStrategy);

// Settings state interface
interface SettingsState {
  /**
  Email for OpenAlex polite pool
   */
  politePoolEmail: string;
  /**
  API key for OpenAlex requests (optional)
   */
  apiKey?: string;
  /**
  Include Walden-related research data
   */
  includeXpac: boolean;
  /**
  Data format version
   */
  dataVersion?: '1' | '2';
  /**
  Show system catalogues (bookmarks, history) in catalogue list
   */
  showSystemCatalogues: boolean;
  /**
  Background processing strategy for auto-population
   */
  backgroundStrategy: BackgroundStrategy;
}

// Default values
const DEFAULT_SETTINGS: SettingsState = {
  politePoolEmail: "",
  includeXpac: true,
  showSystemCatalogues: false,
  backgroundStrategy: 'idle',
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

// Settings keys for storage
const SETTINGS_KEYS = {
  POLITE_POOL_EMAIL: "politePoolEmail",
  API_KEY: "apiKey",
  INCLUDE_XPAC: "includeXpac",
  DATA_VERSION: "dataVersion",
  SHOW_SYSTEM_CATALOGUES: "showSystemCatalogues",
  BACKGROUND_STRATEGY: "backgroundStrategy",
} as const;

/**
 * Pure Dexie settings store service
 */
class SettingsStore {
  private db: SettingsDB;
  private logger = logger;

  constructor() {
    this.db = getDB();
  }

  /**
   * Get all settings
   */
  async getSettings(): Promise<SettingsState> {
    try {
      const records = await this.db.settings.toArray();
      const settings: Partial<SettingsState> = { ...DEFAULT_SETTINGS };

      // Load stored values
      for (const record of records) {
        if (record.key === SETTINGS_KEYS.POLITE_POOL_EMAIL) {
          settings.politePoolEmail = record.value === "undefined" ? "" : record.value;
        }
        if (record.key === SETTINGS_KEYS.API_KEY) {
          settings.apiKey = record.value === "undefined" ? undefined : record.value;
        }
        if (record.key === SETTINGS_KEYS.INCLUDE_XPAC) {
          settings.includeXpac = record.value === "true";
        }
        if (record.key === SETTINGS_KEYS.DATA_VERSION) {
          settings.dataVersion = record.value === "undefined" ? undefined : (record.value as '1' | '2');
        }
        if (record.key === SETTINGS_KEYS.SHOW_SYSTEM_CATALOGUES) {
          settings.showSystemCatalogues = record.value === "true";
        }
        if (record.key === SETTINGS_KEYS.BACKGROUND_STRATEGY && isBackgroundStrategy(record.value)) {
            settings.backgroundStrategy = record.value;
          }
      }

      return settings as SettingsState;
    } catch (error) {
      this.logger?.error("settings", "Failed to load settings", { error });
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Update polite pool email
   * @param email
   */
  async setPolitePoolEmail(email?: string): Promise<void> {
    try {
      const emailValue = email === undefined ? "" : email;
      await this.db.settings.put({
        key: SETTINGS_KEYS.POLITE_POOL_EMAIL,
        value: emailValue,
        updatedAt: new Date(),
      });

      this.logger.debug("settings", "Updated polite pool email", {
        hasEmail: emailValue.length > 0,
        isValid: emailValue ? this.isValidEmail(emailValue) : false,
      });
    } catch (error) {
      this.logger?.error("settings", "Failed to update polite pool email", {
        email,
        error,
      });
      throw error;
    }
  }

  /**
   * Update OpenAlex API key
   * @param apiKey
   */
  async setApiKey(apiKey?: string): Promise<void> {
    try {
      await this.db.settings.put({
        key: SETTINGS_KEYS.API_KEY,
        value: apiKey === undefined ? "undefined" : apiKey,
        updatedAt: new Date(),
      });

      this.logger.debug("settings", "Updated API key", {
        hasApiKey: apiKey !== undefined && apiKey.length > 0,
      });
    } catch (error) {
      this.logger?.error("settings", "Failed to update API key", {
        error,
      });
      throw error;
    }
  }

  /**
   * Update include Xpac setting
   * @param value
   */
  async setIncludeXpac(value: boolean): Promise<void> {
    try {
      await this.db.settings.put({
        key: SETTINGS_KEYS.INCLUDE_XPAC,
        value: String(value),
        updatedAt: new Date(),
      });

      this.logger.debug("settings", "Updated include Xpac", { value });
    } catch (error) {
      this.logger?.error("settings", "Failed to update include Xpac", {
        value,
        error,
      });
      throw error;
    }
  }

  /**
   * Update data version setting
   * @param value
   */
  async setDataVersion(value: '1' | '2' | undefined): Promise<void> {
    try {
      await this.db.settings.put({
        key: SETTINGS_KEYS.DATA_VERSION,
        value: value === undefined ? "undefined" : value,
        updatedAt: new Date(),
      });

      this.logger.debug("settings", "Updated data version", { value });
    } catch (error) {
      this.logger?.error("settings", "Failed to update data version", {
        value,
        error,
      });
      throw error;
    }
  }

  /**
   * Update show system catalogues setting
   * @param value
   */
  async setShowSystemCatalogues(value: boolean): Promise<void> {
    try {
      await this.db.settings.put({
        key: SETTINGS_KEYS.SHOW_SYSTEM_CATALOGUES,
        value: String(value),
        updatedAt: new Date(),
      });

      this.logger.debug("settings", "Updated show system catalogues", { value });
    } catch (error) {
      this.logger?.error("settings", "Failed to update show system catalogues", {
        value,
        error,
      });
      throw error;
    }
  }

  /**
   * Update background processing strategy
   * @param value
   */
  async setBackgroundStrategy(value: BackgroundStrategy): Promise<void> {
    try {
      await this.db.settings.put({
        key: SETTINGS_KEYS.BACKGROUND_STRATEGY,
        value,
        updatedAt: new Date(),
      });

      this.logger.debug("settings", "Updated background strategy", { value });
    } catch (error) {
      this.logger?.error("settings", "Failed to update background strategy", {
        value,
        error,
      });
      throw error;
    }
  }

  /**
   * Get current background processing strategy
   */
  async getBackgroundStrategy(): Promise<BackgroundStrategy> {
    const settings = await this.getSettings();
    return settings.backgroundStrategy;
  }

  /**
   * Reset all settings to defaults
   */
  async resetSettings(): Promise<void> {
    try {
      await this.db.settings.clear();
      this.logger.debug("settings", "Reset all settings to defaults");
    } catch (error) {
      this.logger?.error("settings", "Failed to reset settings", { error });
      throw error;
    }
  }

  /**
   * Validate email format
   * @param email
   */
  isValidEmail(email: string | undefined): boolean {
    if (!email) return false;
    const trimmed = email.trim();
    return EMAIL_REGEX.test(trimmed) && !trimmed.endsWith(".");
  }

  /**
   * Get current polite pool email
   */
  async getPolitePoolEmail(): Promise<string> {
    const settings = await this.getSettings();
    return settings.politePoolEmail;
  }

  /**
   * Get current OpenAlex API key
   */
  async getApiKey(): Promise<string | undefined> {
    const settings = await this.getSettings();
    return settings.apiKey;
  }

  /**
   * Check if a valid email is configured
   */
  async hasValidEmail(): Promise<boolean> {
    const email = await this.getPolitePoolEmail();
    return this.isValidEmail(email);
  }

  /**
   * Get show system catalogues setting
   */
  async getShowSystemCatalogues(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.showSystemCatalogues;
  }

  /**
   * Migrate from old storage (localStorage/IndexedDB hybrid)
   * This should be called once during the transition
   */
  async migrateFromOldStorage(): Promise<void> {
    try {
      // Check if migration already happened
      const migrationKey = "migration-completed";
      const existingMigration = await this.db.settings.get({
        key: migrationKey,
      });

      if (existingMigration) {
        this.logger.debug("settings", "Migration already completed");
        return;
      }

      // Try to load from old localStorage
      let isMigratedData = false;

      if (typeof localStorage !== "undefined") {
        try {
          const oldEmail = localStorage.getItem("settings-state");
          if (oldEmail) {
            // Parse the old Zustand persisted state
            const parsed = JSON.parse(oldEmail);
            const email = parsed?.state?.politePoolEmail;

            if (email && typeof email === "string") {
              await this.setPolitePoolEmail(email);
              isMigratedData = true;
              this.logger.debug("settings", "Migrated email from localStorage");
            }
          }
        } catch (error) {
          this.logger?.warn("settings", "Failed to migrate from localStorage", {
            error,
          });
        }
      }

      // Mark migration as completed
      await this.db.settings.put({
        key: migrationKey,
        value: "true",
        updatedAt: new Date(),
      });

      this.logger.debug("settings", "Migration completed", { migratedData: isMigratedData });
    } catch (error) {
      this.logger?.error("settings", "Migration failed", { error });
    }
  }
}

// Singleton instance
const dexieStore = new SettingsStore();

// Initialize migration on first load (only in browser)
if (typeof window !== "undefined") {
  void dexieStore.migrateFromOldStorage();
}

// Export the Dexie store instance for direct usage
export { dexieStore as settingsStore };
export { SettingsStore };
export const settingsStoreInstance = dexieStore;

// Simple hook for components - no complex state management
export const usePolitePoolEmail = (): string => {
  // This can be enhanced with React state management if needed
  return DEFAULT_SETTINGS.politePoolEmail;
};

export const useHasValidEmail = (): boolean => {
  const email = usePolitePoolEmail();
  return dexieStore.isValidEmail(email);
};

// Direct function exports for when you need explicit calls
export const settingsActions = {
  setPolitePoolEmail: (email: string | undefined) => dexieStore.setPolitePoolEmail(email),
  setApiKey: (apiKey: string | undefined) => dexieStore.setApiKey(apiKey),
  resetSettings: () => dexieStore.resetSettings(),
  isValidEmail: (email: string | undefined) => dexieStore.isValidEmail(email),
  getPolitePoolEmail: () => dexieStore.getPolitePoolEmail(),
  getApiKey: () => dexieStore.getApiKey(),
  hasValidEmail: () => dexieStore.hasValidEmail(),
  setShowSystemCatalogues: (value: boolean) => dexieStore.setShowSystemCatalogues(value),
  getShowSystemCatalogues: () => dexieStore.getShowSystemCatalogues(),
  setBackgroundStrategy: (value: BackgroundStrategy) => dexieStore.setBackgroundStrategy(value),
  getBackgroundStrategy: () => dexieStore.getBackgroundStrategy(),
};

// Export the BackgroundStrategy type for consumers
export type { BackgroundStrategy };

// Zustand-style compatibility - simple selector pattern
export const useSettingsStore = <T>(selector: (state: typeof settingsActions & { politePoolEmail: string }) => T): T => {
  const state = {
    ...settingsActions,
    politePoolEmail: usePolitePoolEmail(),
  };
  return selector(state);
};
