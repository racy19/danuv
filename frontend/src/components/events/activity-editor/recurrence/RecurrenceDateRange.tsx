type RecurrenceDateRangeProps = {
  isMultiRecurring: boolean;

  startTime: string;
  endTime: string;
  intervalStart: string;
  intervalEnd: string;

  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onIntervalStartChange: (value: string) => void;
  onIntervalEndChange: (value: string) => void;
};

export const RecurrenceDateRange = ({
  isMultiRecurring,
  startTime,
  endTime,
  intervalStart,
  intervalEnd,
  onStartTimeChange,
  onEndTimeChange,
  onIntervalStartChange,
  onIntervalEndChange,
}: RecurrenceDateRangeProps) => {
  return (
    <div className="flex flex-col md:flex-row w-full border-b border-blue-300">
      {!isMultiRecurring && (
        <div className="md:w-1/2 p-4 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-blue-300">
          <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
            Čas aktivity
          </label>

          <div className="flex items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) =>
                onStartTimeChange(e.target.value)
              }
              className="bg-white border border-blue-200 rounded px-2 py-1 text-lg font-semibold focus:border-blue-400 focus:outline-none shadow-sm"
            />

            <span className="text-blue-400 font-bold">→</span>

            <input
              type="time"
              value={endTime}
              onChange={(e) =>
                onEndTimeChange(e.target.value)
              }
              className="bg-white border border-blue-200 rounded px-2 py-1 text-lg font-semibold focus:border-blue-400 focus:outline-none shadow-sm"
            />
          </div>
        </div>
      )}

      <div
        className={`p-4 flex flex-col gap-2 ${isMultiRecurring ? "w-full" : "md:w-1/2"
          }`}
      >
        <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
          Interval opakování
        </label>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={intervalStart}
            onChange={(e) =>
              onIntervalStartChange(e.target.value)
            }
            className="bg-white border border-blue-200 rounded px-2 py-1 text-sm font-semibold focus:border-blue-400 focus:outline-none shadow-sm"
          />

          <span className="text-blue-400 font-bold">→</span>

          <input
            type="date"
            value={intervalEnd}
            onChange={(e) =>
              onIntervalEndChange(e.target.value)
            }
            className="bg-white border border-blue-200 rounded px-2 py-1 text-sm font-semibold focus:border-blue-400 focus:outline-none shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};