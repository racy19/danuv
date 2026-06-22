import type { Id, Note, RenderableCalendarItem } from "../../../shared/types";

export const hasNoteEditorChanges = (
    originalNote: Note | undefined,
    activeNoteTitle: string,
    activeNoteContent: string,
    activeNoteType: string,
    tempNoteLinks: Set<Id>,
    originalNoteLinks: Set<Id>,
    tempStatusChanges: Record<string, unknown>,
    areSetsEqual: <T>(a: Set<T>, b: Set<T>) => boolean
): boolean => {
    if (!originalNote) {
        return false;
    }

    return (
        activeNoteTitle !== (originalNote.title || "") ||
        activeNoteContent !== (originalNote.content || "") ||
        activeNoteType !== (originalNote.type || "text") ||
        !areSetsEqual(tempNoteLinks, originalNoteLinks) ||
        Object.keys(tempStatusChanges).length > 0
    );
};

type SearchableTask = {
    title?: string;
    type?: string;
};

export const getNoteLinkSearchResults = <T extends SearchableTask>(
    items: T[],
    query: string
): T[] => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return items.filter((item) => item.type !== "note");
    }

    return items.filter((item) =>
        item.title &&
        item.title.toLowerCase().includes(normalizedQuery) &&
        item.type !== "note"
    );
};

type FindItemAndParentResult = {
    item?: RenderableCalendarItem;
    parent?: RenderableCalendarItem | null;
};

export type LinkedNoteTarget = RenderableCalendarItem & {
    title: string;
    isSuppressed: boolean;
};

export const getLinkedNoteTargets = (
    noteLinks: Set<Id>,
    events: RenderableCalendarItem[],
    findItemAndParent: (
        events: RenderableCalendarItem[],
        itemId: Id
    ) => FindItemAndParentResult | null,
    getDisplayTitle: (
        item: RenderableCalendarItem,
        parent?: RenderableCalendarItem | null
    ) => string
): LinkedNoteTarget[] => {
    return Array.from(noteLinks).flatMap((id) => {
        const found = findItemAndParent(events, id);

        if (!found?.item) {
            return [];
        }

        return [
            {
                ...found.item,
                title: getDisplayTitle(found.item, found.parent),
                isSuppressed: found.item.isSuppressed ?? false,
            },
        ];
    });
};