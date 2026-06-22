import type {
    CalendarItem,
    Id,
    Note,
} from "../../../shared/types";

export type RenderableCalendarItem = CalendarItem & {
    isInstance?: boolean;
    parentId?: Id;
    isGenerated?: boolean;
    isSuppressed?: boolean;
};

export type LinkedNoteTarget = RenderableCalendarItem & {
    title: string;
};

export type SharedNotesMap = Record<Id, Note>;