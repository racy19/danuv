import { ArrowRight } from "lucide-react";

import type { DateString, TimeString } from "../../../../../../shared/types";

type SingleActivityDateFieldsProps = {
  startDate: DateString;
  endDate: DateString;
  startTime: TimeString;
  endTime: TimeString;

  onStartDateChange: (value: DateString) => void;
  onEndDateChange: (value: DateString) => void;
  onStartTimeChange: (value: TimeString) => void;
  onEndTimeChange: (value: TimeString) => void;
};

export const SingleActivityDateFields = ({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: SingleActivityDateFieldsProps) => {
  return (
    <div className="px-4 py-2 flex flex-wrap gap-4 items-center mt-2">
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-blue-800 uppercase mb-1">
          Začátek
        </label>

        <div className="flex gap-1">
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="border rounded px-2 py-1 text-lg font-semibold focus:outline-none shadow-sm bg-white border-blue-200 focus:border-blue-400"
          />

          <input
            type="time"
            value={startTime}
            onChange={(event) => onStartTimeChange(event.target.value)}
            className="bg-white border border-blue-200 rounded px-2 py-1 text-lg font-semibold focus:border-blue-400 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      <ArrowRight className="w-4 h-4 mt-4 text-blue-400" />

      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-blue-800 uppercase mb-1">
          Konec
        </label>

        <div className="flex gap-1">
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="border rounded px-2 py-1 text-lg font-semibold focus:outline-none shadow-sm bg-white border-blue-200 focus:border-blue-400"
          />

          <input
            type="time"
            value={endTime}
            onChange={(event) => onEndTimeChange(event.target.value)}
            className="bg-white border border-blue-200 rounded px-2 py-1 text-lg font-semibold focus:border-blue-400 focus:outline-none shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};