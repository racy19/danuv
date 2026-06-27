import { ChevronDown } from "lucide-react";

import { DAY_NAMES_SHORT } from "../../../../utils/dateUtils";
import type {
  RecurrencePattern,
  RecurrenceUnit,
  WeekParity,
} from "../../../../../../shared/types";

type RecurrencePatternEditorProps = {
  pattern: RecurrencePattern;
  interval: number;
  unit: RecurrenceUnit;
  days: number[];
  weeks: WeekParity[];

  onPatternChange: (pattern: RecurrencePattern) => void;
  onIntervalChange: (interval: number) => void;
  onUnitChange: (unit: RecurrenceUnit) => void;
  onToggleDay: (dayIndex: number) => void;
  onToggleWeek: (week: WeekParity) => void;
};

export const RecurrencePatternEditor = ({
  pattern,
  interval,
  unit,
  days,
  weeks,
  onPatternChange,
  onIntervalChange,
  onUnitChange,
  onToggleDay,
  onToggleWeek,
}: RecurrencePatternEditorProps) => {
  const showCustomInterval = pattern === "custom";
  const showDayPicker =
    (pattern === "custom" && unit === "week") || pattern === "weekly";

  return (
    <div className="flex flex-col w-full px-5 py-3">
      <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-2 text-left">
        Frekvence opakování
      </label>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
        <div className="relative w-32 shrink-0">
          <select
            value={pattern}
            onChange={(event) =>
              onPatternChange(event.target.value as RecurrencePattern)
            }
            className="w-full bg-white border border-blue-200 rounded px-3 py-1.5 text-sm font-semibold focus:border-blue-400 focus:outline-none shadow-sm appearance-none text-left cursor-pointer"
          >
            <option value="daily">Denně</option>
            <option value="weekly">Týdně</option>
            <option value="monthly">Měsíčně</option>
            <option value="yearly">Ročně</option>
            <option value="custom">Vlastní...</option>
          </select>

          <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {showCustomInterval && (
          <div className="flex items-center animate-in fade-in shrink-0 bg-white border border-blue-300 rounded-lg shadow-sm overflow-hidden h-[34px]">
            <div className="px-3 h-full flex items-center bg-blue-50 border-r border-blue-200 text-[11px] font-bold text-blue-800 uppercase tracking-wide">
              Každý
            </div>

            <input
              type="number"
              min="1"
              value={interval}
              onChange={(event) =>
                onIntervalChange(Number(event.target.value))
              }
              className="w-14 h-full text-center text-sm font-bold text-blue-900 focus:outline-none bg-transparent"
            />

            <div className="w-px h-4 bg-blue-200 mx-0" />

            <div className="relative h-full">
              <select
                value={unit}
                onChange={(event) =>
                  onUnitChange(event.target.value as RecurrenceUnit)
                }
                className="appearance-none h-full pl-3 pr-8 text-sm font-semibold text-blue-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="day">den</option>
                <option value="week">týden</option>
                <option value="month">měsíc</option>
                <option value="year">rok</option>
              </select>

              <ChevronDown className="w-3.5 h-3.5 text-blue-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {showDayPicker && (
          <div className="flex flex-wrap gap-1 animate-in fade-in slide-in-from-left-2 md:ml-2 items-center">
            {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
              <button
                key={dayIndex}
                type="button"
                onClick={() => onToggleDay(dayIndex)}
                className={`w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center transition-all ${days.includes(dayIndex)
                    ? "bg-blue-600 text-white shadow-sm scale-110"
                    : "bg-white border border-blue-200 text-blue-400 hover:border-blue-400 hover:text-blue-600"
                  }`}
              >
                {DAY_NAMES_SHORT[dayIndex].substring(0, 2)}
              </button>
            ))}

            {pattern === "weekly" && (
              <>
                <div className="w-px h-6 bg-blue-200 mx-1" />

                <button
                  type="button"
                  onClick={() => onToggleWeek("odd")}
                  className={`h-7 px-2 rounded-full text-[9px] font-bold flex items-center justify-center transition-all ${weeks.includes("odd")
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white border border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700"
                    }`}
                >
                  Lichý
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWeek("even")}
                  className={`h-7 px-2 rounded-full text-[9px] font-bold flex items-center justify-center transition-all ${weeks.includes("even")
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white border border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700"
                    }`}
                >
                  Sudý
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};