import type { Id } from "./calendar";

export type NoteType = "text" | "heading" | "canvas";

export interface Note {
    id: Id;
    title: string;
    type: NoteType;

    content?: string;

    isPinned?: boolean;
    isHidden?: boolean;

    canvasData?: unknown;
}