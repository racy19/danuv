import type { CalendarItem, Id, Note } from "../../../shared/types";
import { SharedNotesMap } from "../types/renderType";
import type { ListSortSettings } from "./sortUtils";
import { sortAndGroupItems } from "./sortUtils";

type ItemWithChildren = CalendarItem & {
	linkedNoteIds?: Id[];
	subtasks?: CalendarItem[];
};

type SortableChild =
	| (Note & { sortType: "note" })
	| (CalendarItem & { sortType: "calendar" });

export type ChildItem =
	| {
		kind: "note";
		note: Note;
	}
	| {
		kind: "calendar";
		item: CalendarItem;
	};

export const getSortedChildren = (
	item: ItemWithChildren,
	sharedNotes: SharedNotesMap,
	sortSettings?: ListSortSettings
): ChildItem[] => {
	const resolvedNotes: SortableChild[] = (item.linkedNoteIds || [])
		.map((id) => sharedNotes[id])
		.filter((note): note is Note => Boolean(note))
		.map((note) => ({
			...note,
			sortType: "note" as const,
		}));

	const subtasks: SortableChild[] = (item.subtasks || []).map((subtask) => ({
		...subtask,
		sortType: "calendar" as const,
	}));

	const sortedChildren = sortAndGroupItems(
		[...resolvedNotes, ...subtasks],
		sortSettings
	);

	return sortedChildren.map((child) => {
		if (child.sortType === "note") {
			const { sortType, ...note } = child;

			return {
				kind: "note",
				note,
			};
		}

		const { sortType, ...calendarItem } = child;

		return {
			kind: "calendar",
			item: calendarItem,
		};
	});
};