import { Calendar as CalendarIcon, ChevronDown, Save, X } from "lucide-react";

import type { ActivityType, MultiRecurringDefinition } from "../../../../../shared/types";

type ActivityEditorHeaderProps = {
  activityType: ActivityType;
  multiDefs: MultiRecurringDefinition[];
  hasChanges: boolean;

  onActivityTypeChange: (activityType: ActivityType) => void;
  onMultiDefsChange: (multiDefs: MultiRecurringDefinition[]) => void;
  onSave: () => void;
  onClose: () => void;
};

export const ActivityEditorHeader = ({
  activityType,
  multiDefs,
  hasChanges,
  onActivityTypeChange,
  onMultiDefsChange,
  onSave,
  onClose,
}: ActivityEditorHeaderProps) => {
  const handleTypeChange = (value: ActivityType) => {
    onActivityTypeChange(value);

    if (value === "multi_recurring" && multiDefs.length === 0) {
      onMultiDefsChange([{ startTime: "", endTime: "", title: "" }]);
    }
  };

  return (
    <div className="bg-transparent px-4 py-3 border-b border-blue-200 flex items-center gap-3 shrink-0">
      <CalendarIcon className="w-5 h-5 text-blue-600 shrink-0" />

      <div className="relative group flex-1">
        <select
          value={activityType}
          onChange={(event) =>
            handleTypeChange(event.target.value as ActivityType)
          }
          className="w-full appearance-none bg-white border border-blue-300 pl-4 pr-10 py-2 text-sm font-bold text-blue-900 tracking-wide hover:border-blue-400 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
        >
          <option value="single">● Jednorázová aktivita</option>
          <option value="recurring">↻ Opakující se aktivita V1</option>
          <option value="multi_recurring">
            ☰ Skupina více opakujících se aktivit
          </option>
        </select>

        <ChevronDown className="w-4 h-4 text-blue-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="w-9 h-9 flex items-center justify-center shrink-0">
        {hasChanges && (
          <button
            type="button"
            onClick={onSave}
            className="w-full h-full bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 rounded-full transition-colors shadow-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
          >
            <Save className="w-5 h-5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-9 h-9 flex items-center justify-center bg-white/50 hover:bg-red-100 text-blue-700 hover:text-red-600 rounded-full transition-colors shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};