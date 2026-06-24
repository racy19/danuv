import type { RefObject } from "react";
import { Check, HelpCircle, Info, X } from "lucide-react";

import type { ActivityType } from "../../../../../shared/types";

type ActivityEditorBasicFieldsProps = {
  activityType: ActivityType;
  title: string;
  completed: boolean;

  showNameHelp: boolean;
  nameHelpRef?: RefObject<HTMLDivElement | null>;
  titleRef?: RefObject<HTMLTextAreaElement | null>;

  onTitleChange: (title: string) => void;
  onCompletedChange: (completed: boolean) => void;
  onShowNameHelpChange: (show: boolean) => void;
};

export const ActivityEditorBasicFields = ({
  activityType,
  title,
  completed,
  showNameHelp,
  nameHelpRef,
  titleRef,
  onTitleChange,
  onCompletedChange,
  onShowNameHelpChange,
}: ActivityEditorBasicFieldsProps) => {
  const isRecurring = activityType === "recurring";
  const isMultiRecurring = activityType === "multi_recurring";

  const handleTitleInput = (
    event: React.FormEvent<HTMLTextAreaElement>
  ) => {
    const textarea = event.currentTarget;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  };

  return (
    <div className="bg-transparent px-4 pt-4 pb-4 shrink-0 border-b border-blue-200 flex items-start gap-3">
      {!isRecurring && !isMultiRecurring && (
        <button
          type="button"
          onClick={() => onCompletedChange(!completed)}
          className="mt-1 w-9 h-9 bg-white border border-blue-200 rounded-lg flex items-center justify-center transition-colors shrink-0 hover:bg-blue-50"
        >
          {completed ? (
            <Check className="w-6 h-6 text-green-600" strokeWidth={3} />
          ) : (
            <X className="w-3 h-3 text-red-500" strokeWidth={3} />
          )}
        </button>
      )}

      <div className="flex-1 flex items-center gap-2">
        {isMultiRecurring ? (
          <div className="flex flex-col w-full gap-1">
            <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide pl-0.5">
              Název skupiny aktivit
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              className={`font-bold text-sm border focus:border-blue-400 rounded px-3 py-1.5 focus:outline-none w-full text-slate-800 placeholder:text-slate-400 shadow-sm h-[34px] transition-colors ${!title?.trim()
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-blue-200"
                }`}
              placeholder="Název skupiny aktivit..."
            />
          </div>
        ) : (
          <textarea
            ref={titleRef}
            rows={1}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            onInput={handleTitleInput}
            className="font-bold text-xl bg-white border border-transparent focus:border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-0 w-full text-slate-800 placeholder:text-slate-400 shadow-sm resize-none overflow-hidden"
            placeholder="Název aktivity..."
            style={{ minHeight: "2.5rem" }}
          />
        )}

        {isRecurring && (
          <div className="relative shrink-0" ref={nameHelpRef}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onShowNameHelpChange(!showNameHelp);
              }}
              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              title="Nápověda ke kódům v názvu"
            >
              <Info className="w-5 h-5" />
            </button>

            {showNameHelp && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 text-white p-3 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 text-xs leading-relaxed border border-slate-700">
                <div className="font-bold mb-2 text-blue-300 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Automatické číslování
                </div>

                <p className="mb-2">
                  V názvu můžete použít tyto kódy pro automatické doplnění čísel:
                </p>

                <ul className="space-y-2">
                  <li>
                    <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">
                      {"<d>"}
                    </code>
                    <span className="ml-1">
                      — Aktuální pořadové číslo dne.
                    </span>
                  </li>
                  <li>
                    <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">
                      {"<s>"}
                    </code>
                    <span className="ml-1">
                      — Celkový počet naplánovaných dní.
                    </span>
                  </li>
                  <li>
                    <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">
                      {"<n>"}
                    </code>
                    <span className="ml-1">
                      — Název skupiny / hlavní aktivity.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};