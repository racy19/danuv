import { AlertTriangle, RefreshCw, Undo } from "lucide-react";
import type { ReactNode } from "react";

type RecurrenceInstancesListProps = {
  instancesCount: number;
  recurrenceNeedsUpdate: boolean;
  hasInstances: boolean;
  children: ReactNode;

  onRegenerate: () => void;
  onRevertChanges: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const RecurrenceInstancesList = ({
  instancesCount,
  recurrenceNeedsUpdate,
  hasInstances,
  children,
  onRegenerate,
  onRevertChanges,
}: RecurrenceInstancesListProps) => {
  return (
    <div className="flex flex-col w-full px-5 pb-5">
      <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-2 text-left">
        Seznam generovaných aktivit ({instancesCount})
      </label>

      {recurrenceNeedsUpdate && (
        <div className="mb-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 flex-wrap">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Parametry rozvrhu se změnily!</span>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRegenerate();
              }}
              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              PŘEGENEROVAT VÝSKYTY
            </button>

            <button
              type="button"
              onClick={onRevertChanges}
              className="px-2 py-1 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
            >
              <Undo className="w-3 h-3" />
              VRÁTIT ZMĚNY
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1 w-full">
        {hasInstances ? (
          children
        ) : (
          <div className="text-center py-4 text-slate-400 italic text-xs">
            Zatím nejsou vygenerovány žádné výskyty.
          </div>
        )}
      </div>
    </div>
  );
};