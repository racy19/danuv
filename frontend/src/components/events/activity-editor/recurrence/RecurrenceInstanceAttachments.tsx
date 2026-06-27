import { CalendarIcon, Check, StickyNote, X } from "lucide-react";

import type { Id, RecurrenceInstance, Note } from "../../../../../../shared/types";

type SharedNotesMap = Record<Id, Note>;

type Props = {
  instance: RecurrenceInstance;
  sharedNotes: SharedNotesMap;
  onOpenNote: (id: Id) => void;
};

export const RecurrenceInstanceAttachments = ({
  instance,
  sharedNotes,
  onOpenNote,
}: Props) => {
  const hasAttachments =
    (instance.linkedNoteIds?.length ?? 0) > 0 ||
    (instance.subtasks?.length ?? 0) > 0;

  if (!hasAttachments) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {instance.subtasks?.map((sub) => {
        const chipClass = sub.completed
          ? "bg-slate-100 text-slate-500 border-slate-300"
          : "bg-blue-50 text-blue-900 border-blue-200";

        const iconClass = sub.completed
          ? "text-slate-400"
          : "text-blue-700";

        return (
          <span
            key={sub.id}
            className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border h-auto relative z-20 ${chipClass}`}
          >
            <div className="w-4 h-4 flex items-center justify-center rounded-sm shrink-0 -ml-0.5">
              {sub.completed ? (
                <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
              ) : (
                <X className="w-3 h-3 text-red-500" strokeWidth={3} />
              )}
            </div>

            <span className="w-px h-3 bg-current opacity-20 mx-0.5" />
            <CalendarIcon className={`w-3 h-3 shrink-0 ${iconClass}`} />

            <span
              className={`whitespace-normal text-left break-words font-medium leading-none ${sub.completed ? "line-through opacity-75" : ""
                }`}
            >
              {sub.title || "Bez názvu"}
            </span>
          </span>
        );
      })}

      {instance.linkedNoteIds?.map((noteId) => (
        <span
          key={noteId}
          className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border h-auto relative z-20 bg-yellow-50 text-yellow-800 border-yellow-200"
        >
          <div className="w-3.5 h-3.5 shrink-0" />
          <span className="w-px h-3 bg-current opacity-20 mx-0.5" />
          <StickyNote className="w-3 h-3 shrink-0 text-yellow-600" />

          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenNote(noteId);
            }}
            className="whitespace-normal text-left break-words cursor-pointer hover:bg-black/10 rounded px-1 -mx-1 transition-colors font-medium leading-none"
          >
            {sharedNotes[noteId]?.title || "Poznámka"}
          </span>
        </span>
      ))}
    </div>
  );
};