import { Save, StickyNote, X } from "lucide-react";
import { NoteType } from "../../../../../shared/types";

type NoteEditorHeaderProps = {
    noteType: NoteType;
    hasChanges: boolean;
    onNoteTypeChange: (noteType: NoteType) => void;
    onSave: () => void;
    onClose: () => void;
};

export const NoteEditorHeader = ({
    noteType,
    hasChanges,
    onNoteTypeChange,
    onSave,
    onClose,
}: NoteEditorHeaderProps) => {
    return (
        <div className="bg-transparent px-4 py-3 border-b border-yellow-200 flex items-center gap-3 shrink-0">
            <StickyNote className="w-5 h-5 text-yellow-600 shrink-0" />

            <div className="flex-1">
                <select
                    value={noteType}
                    onChange={(event) =>
                        onNoteTypeChange(event.target.value as NoteType)
                    }
                    className="bg-transparent text-sm font-bold text-yellow-900 focus:outline-none cursor-pointer"
                >
                    <option value="text">Standardní poznámka</option>
                    <option value="heading">Nadpis (bez obsahu)</option>
                </select>
            </div>

            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                {hasChanges && (
                    <button
                        type="button"
                        onClick={onSave}
                        className="w-full h-full bg-white border border-yellow-200 hover:bg-yellow-100 text-yellow-700 rounded-full transition-colors shadow-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
                    >
                        <Save className="w-5 h-5" />
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center bg-white/50 hover:bg-red-100 text-yellow-700 hover:text-red-600 rounded-full transition-colors shrink-0"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};