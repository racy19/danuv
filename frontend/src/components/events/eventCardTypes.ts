import { Id, Note, RenderableCalendarItem } from "../../../../shared/types";
import { ListSortSettings } from "../../utils/sortUtils";

export type EventActions = {
    toggleStatus: (
        event: React.MouseEvent<HTMLButtonElement>,
        itemId: Id
    ) => void;
    createActivityForActivity: (
        event: React.MouseEvent<HTMLButtonElement>,
        itemId: Id
    ) => void;
    createNoteForActivity: (
        event: React.MouseEvent<HTMLButtonElement>,
        itemId: Id
    ) => void;
    toggleHide: (
        event: React.MouseEvent<HTMLButtonElement>,
        itemId: Id
    ) => void;
    deleteEvent: (
        event: React.MouseEvent<HTMLButtonElement>,
        itemId: Id
    ) => void;
    unlinkNote: (parentId: Id, noteId: Id) => void;
    deleteNote: (noteId: Id) => void;
};
export type DraggingNote = {
    id: Id;
    parentId: Id;
};

export type NoteDropMode = "move" | "link" | "copy";

export type EventHoverZone =
    | "note_move"
    | "note_link"
    | "note_copy"
    | "makeParent"
    | "indent"
    | "insertBefore"
    | "insertAfter"
    | null;

export type EventHandlers = {
    draggingNote: DraggingNote | null;

    onDragStart: (
        event: React.DragEvent<HTMLDivElement>,
        itemId: Id,
        level: number
    ) => void;

    onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;

    onMoveBefore: (draggedId: Id, targetId: Id) => void;
    onMoveAfter: (draggedId: Id, targetId: Id) => void;
    onMoveAsChild: (draggedId: Id, targetId: Id) => void;
    onMoveAsParent: (draggedId: Id, targetId: Id) => void;

    onDragStartNote: (
        event: React.DragEvent<HTMLDivElement>,
        noteId: Id,
        parentId: Id
    ) => void;

    onDropNoteOnNote: (
        draggedNoteId: Id,
        draggedParentId: Id,
        targetParentId: Id,
        targetNoteId: Id,
        hoverZone: "before" | "after" | null
    ) => void;

    onDropNoteOnTask: (
        draggedNoteId: Id,
        draggedParentId: Id,
        targetItemId: Id,
        mode: NoteDropMode
    ) => void;
};

export type SharedNotesMap = Record<Id, Note>;

export type ListEventCardProps = {
    item: RenderableCalendarItem;

    draggingId: Id | null;

    handlers: EventHandlers;
    actions: EventActions;

    isSortEnabled: boolean;

    getDayName: (dateStr: string) => string;
    getTodayStr: () => string;

    sharedNotes: SharedNotesMap;

    level?: number;

    onNoteClick: (noteId: Id) => void;

    onActivityClick?: (itemId: Id | undefined) => void;

    sortSettings?: ListSortSettings;
};