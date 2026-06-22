import { GripVertical } from "lucide-react";
import { useState } from "react";

import type { Id, Note } from "../../../../../shared/types";
import { NoteActions } from "./NoteActions";
import { NoteContent } from "./NoteContent";
import { EventHandlers } from "../../events/eventCardTypes";

type HoverZone = "before" | "after" | null;

type AttachedNoteCardProps = {
    note: Note;
    parentId: Id;
    handlers: EventHandlers;
    isSortEnabled: boolean;
    onNoteClick: (noteId: Id) => void;
    onUnlink: (parentId: Id, noteId: Id) => void;
    onDelete: (noteId: Id) => void;
};

export const AttachedNoteCard = ({
    note,
    parentId,
    handlers,
    isSortEnabled,
    onNoteClick,
    onUnlink,
    onDelete,
}: AttachedNoteCardProps) => {
    const [hoverZone, setHoverZone] = useState<HoverZone>(null);

    const isBeingDragged =
        handlers.draggingNote?.id === note.id &&
        handlers.draggingNote?.parentId === parentId;

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        if (!isSortEnabled) return;

        handlers.onDragStartNote(event, note.id, parentId);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        if (!isSortEnabled || !handlers.draggingNote) return;

        event.preventDefault();
        event.stopPropagation();

        if (isBeingDragged) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const y = event.clientY - rect.top;

        setHoverZone(y < rect.height / 2 ? "before" : "after");
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.stopPropagation();
        setHoverZone(null);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        if (!isSortEnabled || !handlers.draggingNote) return;

        event.preventDefault();
        event.stopPropagation();

        if (!isBeingDragged) {
            handlers.onDropNoteOnNote(
                handlers.draggingNote.id,
                handlers.draggingNote.parentId,
                parentId,
                note.id,
                hoverZone
            );
        }

        setHoverZone(null);
        handlers.onDragEnd(event);
    };

    const handleOpenNote = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        onNoteClick(note.id);
    };

    const handleUnlink = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onUnlink(parentId, note.id);
    };

    const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onDelete(note.id);
    };

    return (
        <div
            className={`flex w-full relative group ${isBeingDragged ? "opacity-50" : ""
                }`}
            draggable={isSortEnabled}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handlers.onDragEnd}
        >
            {hoverZone === "before" && (
                <div className="absolute -top-1 left-0 right-0 h-1 bg-yellow-500 z-50 rounded-full" />
            )}

            {hoverZone === "after" && (
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-500 z-50 rounded-full" />
            )}

            <div
                onClick={handleOpenNote}
                className={`flex-1 flex flex-col border rounded-lg transition-all relative shadow-sm mb-1 cursor-pointer hover:shadow-md ${hoverZone
                    ? "border-yellow-400 bg-yellow-100"
                    : "border-yellow-200 bg-yellow-50"
                    }`}
            >
                <div className="flex items-start px-2 py-1.5 gap-3 min-h-[36px]">
                    {isSortEnabled ? (
                        <div className="cursor-grab active:cursor-grabbing text-yellow-500 hover:text-yellow-700 -ml-1 shrink-0 flex items-center justify-center mt-0.5">
                            <GripVertical className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="w-4 h-4 -ml-1 shrink-0" />
                    )}

                    <NoteContent
                        title={note.title}
                        content={note.content}
                        isHeading={note.type === "heading"}
                    />

                    <NoteActions
                        onUnlink={handleUnlink}
                        onDelete={handleDelete}
                    />
                </div>
            </div>
        </div>
    );
};