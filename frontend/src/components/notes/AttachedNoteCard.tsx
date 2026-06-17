import { GripVertical, Trash2, Unlink } from "lucide-react";
import { useState } from "react";

import type { Id, Note } from "../../../../shared/types";

type HoverZone = "before" | "after" | null;

type DraggingNote = {
    id: Id;
    parentId: Id;
};

type AttachedNoteHandlers = {
    draggingNote: DraggingNote | null;
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
        hoverZone: HoverZone
    ) => void;
    onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
};

type AttachedNoteCardProps = {
    note: Note;
    parentId: Id;
    handlers: AttachedNoteHandlers;
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

    const hasContent =
        note.type !== "heading" &&
        note.content &&
        note.content.trim() !== "";

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

                    <div className="flex-1 flex flex-col min-w-0 pt-0.5">
                        <span className="font-bold text-xs break-words leading-tight text-yellow-900">
                            {note.title}
                        </span>

                        {hasContent && (
                            <div className="text-xs text-yellow-800 mt-1 whitespace-pre-wrap leading-relaxed pb-1">
                                {note.content}
                            </div>
                        )}
                    </div>

                    <div className="absolute right-2 top-0.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-50 backdrop-blur-sm p-0.5 rounded border border-yellow-200 shadow-sm z-20">
                        <button
                            type="button"
                            onClick={handleUnlink}
                            className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                            title="Odpojit"
                        >
                            <Unlink className="w-3.5 h-3.5" />
                        </button>

                        <button
                            type="button"
                            onClick={handleDelete}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Smazat"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};