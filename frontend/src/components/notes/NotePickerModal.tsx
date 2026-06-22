import { Plus, StickyNote, X } from "lucide-react";

import type { Id, Note } from "../../../../shared/types";
import { Modal } from "../ui/Modal";

type NotePickerModalProps = {
  isOpen: boolean;
  notes: Note[];
  onClose: () => void;
  onCreateAndLinkNote: () => void;
  onLinkNote: (noteId: Id) => void;
};

export const NotePickerModal = ({
  isOpen,
  notes,
  onClose,
  onCreateAndLinkNote,
  onLinkNote,
}: NotePickerModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden"
      overlayClassName="z-[60] bg-black/50 p-4 animate-in fade-in"
    >
      <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
        <h3 className="font-bold text-slate-800">
          Vyberte poznámku
        </h3>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
        <button
          type="button"
          onClick={onCreateAndLinkNote}
          className="w-full text-left p-3 hover:bg-blue-50 rounded border border-dashed border-blue-200 text-blue-600 font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Vytvořit novou poznámku
        </button>

        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => onLinkNote(note.id)}
            className="w-full text-left p-3 hover:bg-slate-50 rounded border border-slate-100 text-slate-700 flex items-center gap-3 group"
          >
            <StickyNote className="w-4 h-4 text-yellow-500" />

            <span className="font-medium truncate flex-1">
              {note.title}
            </span>

            <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        ))}
      </div>
    </Modal>
  );
};