import { Check, ChevronDown, ChevronUp, Folder, Search, StickyNote, X } from "lucide-react";

import type { RefObject } from "react";
import type { Id } from "../../../../../shared/types";
import { AcitvityIcon } from "../../icons/ActivityIcon";

type AttachmentKind = "note" | "project";

type ActivityAttachmentItem = {
  id: Id;
  title: string;
  _type: AttachmentKind;
  isSuppressed?: boolean;
};

type ActivityAttachmentsProps = {
  attachments: ActivityAttachmentItem[];
  searchResults: ActivityAttachmentItem[];
  linkedIds: Set<Id>;
  searchQuery: string;
  isDropdownOpen: boolean;
  dropdownRef?: RefObject<HTMLDivElement | null>;

  onSearchQueryChange: (query: string) => void;
  onOpenDropdown: () => void;
  onToggleAttachment: (itemId: Id, shouldLink: boolean) => void;
  onOpenNote: (noteId: Id) => void;
  onOpenProject: (projectId: Id) => void;
};

export const ActivityAttachments = ({
  attachments,
  searchResults,
  linkedIds,
  searchQuery,
  isDropdownOpen,
  dropdownRef,
  onSearchQueryChange,
  onOpenDropdown,
  onToggleAttachment,
  onOpenNote,
  onOpenProject,
}: ActivityAttachmentsProps) => {
  return (
    <div className="bg-transparent p-3 border-t border-blue-200 flex flex-col gap-2 shrink-0 relative z-20">
      <div className="flex flex-wrap gap-1.5 mb-2 max-h-[100px] overflow-y-auto">
        {attachments.map((item) => {
          const isNote = item._type === "note";
          const chipClass = isNote
            ? "bg-yellow-50 text-yellow-800 border-yellow-200"
            : "bg-purple-50 text-purple-900 border-purple-200";
          const iconClass = isNote ? "text-yellow-600" : "text-purple-600";

          if (item.isSuppressed) {
            return (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border h-auto bg-slate-100 text-slate-500 border-slate-300"
              >
                <AcitvityIcon
                  type={isNote ? "note" : "project"}
                  className="w-3 h-3 text-slate-400 shrink-0"
                />
                <span className="font-medium whitespace-normal break-words">
                  {item.title}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleAttachment(item.id, false)}
                  className="ml-1 hover:bg-black/10 rounded p-0.5"
                >
                  <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                </button>
              </span>
            );
          }

          return (
            <span
              key={item.id}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border h-auto ${chipClass}`}
            >
              <div className="w-3.5 h-3.5 shrink-0" />
              <span className="w-px h-3 bg-current opacity-20 mx-0.5" />
              <AcitvityIcon
                type={isNote ? "note" : "project"}
                className={`w-3 h-3 ${iconClass} shrink-0`}
              />
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  if (isNote) onOpenNote(item.id);
                  else onOpenProject(item.id);
                }}
                className="whitespace-normal text-left break-words cursor-pointer hover:bg-black/10 rounded px-1 -mx-1 transition-colors font-medium"
              >
                {item.title}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleAttachment(item.id, false);
                }}
                className="ml-1 hover:bg-black/10 rounded p-0.5 transition-colors"
                title="Odpojit"
              >
                <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
              </button>
            </span>
          );
        })}
      </div>

      <div className="relative flex flex-col" ref={dropdownRef}>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-blue-400/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

          <input
            type="text"
            placeholder="Připojit projekt či poznámku..."
            value={searchQuery}
            onFocus={onOpenDropdown}
            onChange={(event) => {
              onSearchQueryChange(event.target.value);
              onOpenDropdown();
            }}
            className="w-full bg-white border border-blue-300 pl-9 pr-8 py-2 text-sm text-blue-900 placeholder:text-blue-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all shadow-sm"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600/50 pointer-events-none">
            {isDropdownOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-300 rounded-lg max-h-60 flex flex-col shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="overflow-y-auto p-1">
              {searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const isLinked = linkedIds.has(item.id);
                  const isNote = item._type === "note";

                  const rowHoverClass = isNote
                    ? "hover:bg-yellow-50 border-yellow-50"
                    : "hover:bg-purple-50 border-purple-50";

                  const checkBgClass = isNote
                    ? isLinked
                      ? "bg-yellow-500 border-yellow-500 text-white"
                      : "bg-white border-slate-300 text-transparent group-hover:border-yellow-300"
                    : isLinked
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "bg-white border-slate-300 text-transparent group-hover:border-purple-300";

                  const iconColor = isNote ? "text-yellow-500" : "text-purple-500";
                  const textColor = isNote ? "text-yellow-900" : "text-purple-900";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleAttachment(item.id, !isLinked);
                      }}
                      className={`w-full text-left py-1.5 px-2 border-b last:border-0 flex items-start gap-2 transition-colors rounded ${rowHoverClass} group`}
                    >
                      <div
                        className={`w-4 h-4 flex items-center justify-center rounded border transition-colors shrink-0 mt-0.5 ${checkBgClass}`}
                      >
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </div>

                      {isNote ? (
                        <StickyNote
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${iconColor}`}
                        />
                      ) : (
                        <Folder
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${iconColor}`}
                        />
                      )}

                      <span
                        className={`flex-1 text-xs break-words leading-tight font-medium ${textColor}`}
                      >
                        {item.title}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  {searchQuery ? "Žádné výsledky." : "Začněte psát pro vyhledání..."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};