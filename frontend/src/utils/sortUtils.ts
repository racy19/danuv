export const GROUP_ORDER_OPTIONS = [
	{ value: "act_note", label: "Aktivity ➜ Poznámky" },
	{ value: "note_act", label: "Poznámky ➜ Aktivity" },
	{ value: "none", label: "Žádné (Promíchat)" },
] as const;

export const INTERNAL_SORT_OPTIONS = [
	{ value: "custom", label: "Vlastní (Drag & Drop)" },
	{ value: "az", label: "Abecedně A-Z" },
	{ value: "za", label: "Abecedně Z-A" },
	{ value: "dateAsc", label: "Od nejstaršího" },
	{ value: "dateDesc", label: "Od nejnovějšího" },
] as const;

export type GroupOrder = typeof GROUP_ORDER_OPTIONS[number]["value"];
export type InternalSort = typeof INTERNAL_SORT_OPTIONS[number]["value"];

export interface ListSortSettings {
	group: GroupOrder;
	actSort: InternalSort;
	noteSort: InternalSort;
}

/**
 * Minimal shape required for sorting and grouping.
 *
 * This utility intentionally does not depend on the full domain model
 * and can therefore sort activities, notes, or any future item type
 * that exposes these fields.
 */
type SortableItem = {
	sortType?: "note" | "calendar";
	type?: string;
	title?: string;
	start?: string;
	startTime?: string;
};

type Comparator<T> = (a: T, b: T) => number;

/**
 * Sort items alphabetically (A → Z).
 */
const sortByTitleAsc: Comparator<SortableItem> = (a, b) =>
	(a.title || "").localeCompare(b.title || "");

/**
 * Sort items alphabetically (Z → A).
 */
const sortByTitleDesc: Comparator<SortableItem> = (a, b) =>
	(b.title || "").localeCompare(a.title || "");

/**
 * Sort items by date ascending.
 *
 * Items without a date are placed at the end.
 * If dates are equal, startTime is used as a secondary key.
 */
const sortByDateAsc: Comparator<SortableItem> = (a, b) => {
	const aDate = a.start || "9999-99-99";
	const bDate = b.start || "9999-99-99";

	if (aDate !== bDate) {
		return aDate.localeCompare(bDate);
	}

	return (a.startTime || "00:00").localeCompare(b.startTime || "00:00");
};

/**
 * Sort items by date descending.
 *
 * Items without a date are placed at the end.
 * If dates are equal, startTime is used as a secondary key.
 */
const sortByDateDesc: Comparator<SortableItem> = (a, b) => {
	const aDate = a.start || "0000-00-00";
	const bDate = b.start || "0000-00-00";

	if (aDate !== bDate) {
		return bDate.localeCompare(aDate);
	}

	return (b.startTime || "00:00").localeCompare(a.startTime || "00:00");
};

// --- Comparator ---

/**
 * Returns a comparator for the selected sorting method.
 *
 * Returns null for "custom" because custom ordering is handled
 * by drag & drop and should preserve the existing array order.
 */
const getComparator = (
	method: InternalSort
): Comparator<SortableItem> | null => {
	switch (method) {
		case "az":
			return sortByTitleAsc;

		case "za":
			return sortByTitleDesc;

		case "dateAsc":
			return sortByDateAsc;

		case "dateDesc":
			return sortByDateDesc;

		case "custom":
			return null;
	}
};

/**
 * Sorts items using the selected method.
 *
 * Never mutates the original array.
 */
const sortItems = <T extends SortableItem>(
	items: T[],
	method: InternalSort
): T[] => {
	const comparator = getComparator(method);

	if (!comparator) {
		return items;
	}

	return [...items].sort(comparator);
};

// --- Grouping and Sorting ---

/**
 * Sorts and groups notes and activities according to user settings.
 *
 * Supported grouping modes:
 * - act_note: activities first, notes second
 * - note_act: notes first, activities second
 * - none: treat everything as a single list
 */
export const sortAndGroupItems = <T extends SortableItem>(
	items: T[],
	settings?: ListSortSettings
): T[] => {
	if (!settings) {
		return items;
	}

	if (settings.group === "none") {
		return sortItems(items, settings.actSort);
	}

	const notes = items.filter((item) => item.sortType === "note");
	const activities = items.filter((item) => item.sortType !== "note");

	const sortedNotes = sortItems(notes, settings.noteSort);
	const sortedActivities = sortItems(activities, settings.actSort);

	return settings.group === "act_note"
		? [...sortedActivities, ...sortedNotes]
		: [...sortedNotes, ...sortedActivities];
};

// --- Other utilities ---

type SortableItemType = string;

/**
 * Returns whether drag & drop sorting is enabled for a child item type.
 */
export const isCustomSortingEnabled = (
	itemType: SortableItemType,
	sortSettings?: ListSortSettings
): boolean => {
	if (!sortSettings) {
		return true;
	}

	if (sortSettings.group === "none") {
		return sortSettings.actSort === "custom";
	}

	if (itemType === "note") {
		return sortSettings.noteSort === "custom";
	}

	return sortSettings.actSort === "custom";
};