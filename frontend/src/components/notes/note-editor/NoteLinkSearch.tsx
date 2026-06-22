import { Check, Search } from "lucide-react";

import type { Id } from "../../../../../shared/types";
import { RenderableCalendarItem } from "../../../types/renderType";

type NoteLinkSearchProps = {
  query: string;
  results: RenderableCalendarItem[];
  linkedIds: Set<Id>;
  isOpen: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onQueryChange: (query: string) => void;
  onOpen: () => void;
  onToggleLink: (itemId: Id, shouldLink: boolean) => void;
};

export const NoteLinkSearch = ({
  query,
  results,
  linkedIds,
  isOpen,
  containerRef,
  onQueryChange,
  onOpen,
  onToggleLink,
}: NoteLinkSearchProps) => {
  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-yellow-600/50 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder="Připojit k aktivitě nebo projektu..."
          value={query}
          onFocus={onOpen}
          onChange={(event) => {
            onQueryChange(event.target.value);
            onOpen();
          }}
          className="w-full bg-white border border-yellow-300 pl-9 pr-8 py-2 text-sm text-yellow-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 shadow-sm transition-all"
        />
      </div>

      {isOpen && (
        <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-yellow-300 rounded-lg max-h-60 flex flex-col shadow-xl z-50 overflow-hidden">
          <div className="overflow-y-auto p-1">
            {results.map((item) => {
              const isLinked = linkedIds.has(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onToggleLink(item.id, !isLinked)
                  }
                  className="w-full text-left py-1.5 px-2 border-b last:border-0 flex items-start gap-2 hover:bg-yellow-50 group rounded"
                >
                  <div
                    className={`w-4 h-4 flex items-center justify-center rounded border transition-colors shrink-0 mt-0.5 ${isLinked
                        ? "bg-yellow-500 border-yellow-500 text-white"
                        : "bg-white border-slate-300 text-transparent"
                      }`}
                  >
                    <Check className="w-3 h-3" />
                  </div>

                  <span className="flex-1 text-xs text-yellow-900 font-medium">
                    {item.title}
                  </span>
                </button>
              );
            })}

            {results.length === 0 && (
              <div className="p-4 text-center text-xs text-yellow-700/50 italic">
                Žádné výsledky...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};