import { defaultEvents } from "../data/mockEvents";
import { defaultSharedNotes } from "../data/mockNotes";

export const STORAGE_KEYS = {
	events: "calendarAppV8_Demo_v7",
	notes: "calendarAppV8_Notes_v7",
	showStats: "calendarAppV8_ShowStats",
	listSort: "calendarAppV8_ListSort",
} as const;

// --- Load ---

/**
 * Utility functions for saving and loading data from localStorage.
 * Provides type safety and error handling to ensure smooth operation.
 * @param key The key under which the data is stored in localStorage.
 * @param fallback The default value to return if loading fails or if no data is found.
 * @returns The loaded data parsed from JSON, or the fallback value if loading fails.   
 */
export const loadFromStorage = <T>(key: string, fallback: T): T => {
	try {
		const saved = localStorage.getItem(key);

		if (!saved) {
			return fallback;
		}

		return JSON.parse(saved) as T;
	} catch (error) {
		console.error(`Failed to load "${key}" from localStorage`, error);
		return fallback;
	}
};

// --- Save ---

/**
 * Utility function to save data to localStorage.
 * Provides error handling to ensure smooth operation.
 * @param key The key under which the data will be stored.
 * @param value The data to be stored, which will be serialized to JSON.
 */
export const saveToStorage = <T>(key: string, value: T): void => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error(`Failed to save "${key}" to localStorage`, error);
	}
};

export const resetStorage = () => {
	saveToStorage(STORAGE_KEYS.events, defaultEvents);
	saveToStorage(STORAGE_KEYS.notes, defaultSharedNotes);
	saveToStorage(STORAGE_KEYS.showStats, true);
	saveToStorage(STORAGE_KEYS.listSort, undefined);
}

// --- Helpers for specific data types ---
export const loadEvents = () =>
	loadFromStorage(STORAGE_KEYS.events, defaultEvents);

export const saveEvents = (events: unknown) =>
	saveToStorage(STORAGE_KEYS.events, events);

export const loadNotes = () =>
	loadFromStorage(STORAGE_KEYS.notes, defaultSharedNotes);

export const saveNotes = (notes: unknown) =>
	saveToStorage(STORAGE_KEYS.notes, notes);

export const loadShowStats = () =>
	loadFromStorage(STORAGE_KEYS.showStats, true);

export const saveShowStats = (showStats: boolean) =>
	saveToStorage(STORAGE_KEYS.showStats, showStats);