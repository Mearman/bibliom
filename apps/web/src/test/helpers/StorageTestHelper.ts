import type { Page } from '@playwright/test';

/**
 * StorageTestHelper - IndexedDB/localStorage utilities for E2E test isolation
 *
 * Provides methods to clear and manage browser storage in Playwright tests.
 * Ensures test isolation by clearing all storage between tests.
 * @example
 * ```typescript
 * const helper = storageTestHelper(page);
 * await helper.clearAllStorage();
 * await helper.seedTestData({ settings: { theme: 'dark' } });
 * ```
 */
export class StorageTestHelper {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Clear all browser storage (IndexedDB, localStorage, sessionStorage)
	 */
	async clearAllStorage(): Promise<void> {
		await Promise.all([
			this.clearIndexedDB(),
			this.clearLocalStorage(),
			this.clearSessionStorage(),
		]);
	}

	/**
	 * Delete all IndexedDB databases
	 */
	async clearIndexedDB(): Promise<void> {
		await this.page.evaluate(async () => {
			const databases = await window.indexedDB.databases();
			await Promise.all(
				databases.map((database) => {
					if (database.name) {
						return new Promise<void>((resolve, reject) => {
							const request = window.indexedDB.deleteDatabase(database.name!);
							request.onsuccess = () => resolve();
							request.onerror = () => reject(request.error);
							request.onblocked = () => reject(new Error('Database deletion blocked'));
						});
					}
					return Promise.resolve();
				})
			);
		});
	}

	/**
	 * Clear localStorage
	 */
	async clearLocalStorage(): Promise<void> {
		await this.page.evaluate(() => {
			window.localStorage.clear();
		});
	}

	/**
	 * Clear sessionStorage
	 */
	async clearSessionStorage(): Promise<void> {
		await this.page.evaluate(() => {
			window.sessionStorage.clear();
		});
	}

	/**
	 * Set a localStorage item
	 * @param key
	 * @param value
	 */
	async setLocalStorageItem(key: string, value: string): Promise<void> {
		await this.page.evaluate(
			({ k, v }: { k: string; v: string }) => {
				window.localStorage.setItem(k, v);
			},
			{ k: key, v: value }
		);
	}

	/**
	 * Get a localStorage item
	 * @param key
	 */
	async getLocalStorageItem(key: string): Promise<string | null> {
		return await this.page.evaluate(
			(k: string) => {
				return window.localStorage.getItem(k);
			},
			key
		);
	}

	/**
	 * Seed localStorage with test data (JSON stringified)
	 * @param data
	 */
	async seedTestData(data: Record<string, unknown>): Promise<void> {
		await this.page.evaluate(
			(testData: Record<string, unknown>) => {
				for (const [key, value] of Object.entries(testData)) {
					window.localStorage.setItem(key, JSON.stringify(value));
				}
			},
			data
		);
	}

	/**
	 * Verify all storage is cleared
	 * @returns true if all storage is empty
	 */
	async verifyStorageCleared(): Promise<boolean> {
		return await this.page.evaluate(async () => {
			// Check localStorage
			if (window.localStorage.length > 0) {
				return false;
			}

			// Check sessionStorage
			if (window.sessionStorage.length > 0) {
				return false;
			}

			// Check IndexedDB
			const databases = await window.indexedDB.databases();
			return databases.length === 0;
		});
	}
}

/**
 * Factory function to create StorageTestHelper instance
 * @param page
 */
export const storageTestHelper = (page: Page): StorageTestHelper => {
	return new StorageTestHelper(page);
};
