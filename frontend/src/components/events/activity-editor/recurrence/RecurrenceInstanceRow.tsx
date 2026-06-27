import type { RefObject } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  Edit3,
  Eye,
  RotateCw,
  Save,
  X,
} from "lucide-react";

import type {
  Id,
  Note,
  RecurrenceInstance,
} from "../../../../../../shared/types";

import { RecurrenceInstanceAttachments } from "./RecurrenceInstanceAttachments";

type InstanceEditData = {
  title: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

type Props = {
  instance: RecurrenceInstance;

  isEditing: boolean;
  isMultiRecurring: boolean;
  activeActivityTitle: string;

  currentDValue: string | number;
  totalSValue: string | number;

  instanceEditData: InstanceEditData;
  activeInstanceTextareaRef?: RefObject<HTMLTextAreaElement | null>;

  sharedNotes: Record<Id, Note>;

  onToggleComplete: (instanceId: Id) => void;
  onEditDataChange: (data: InstanceEditData) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (instance: RecurrenceInstance) => void;
  onRestore: (event: React.MouseEvent<HTMLButtonElement>, instanceId: Id) => void;
  onToggleSuppression: (instanceId: Id) => void;
  onOpenNote: (noteId: Id) => void;
};

export const RecurrenceInstanceRow = ({
  instance,
  isEditing,
  isMultiRecurring,
  activeActivityTitle,
  currentDValue,
  totalSValue,
  instanceEditData,
  activeInstanceTextareaRef,
  sharedNotes,
  onToggleComplete,
  onEditDataChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onRestore,
  onToggleSuppression,
  onOpenNote,
}: Props) => {
  const isSuppressed = Boolean(instance.isSuppressed);
  const isModified = Boolean(instance.isEdited);

  const hasInstanceChanges =
    isEditing &&
    (instanceEditData.date !== instance.date ||
      instanceEditData.endDate !== (instance.endDate || instance.date) ||
      instanceEditData.startTime !== (instance.startTime || "") ||
      instanceEditData.endTime !== (instance.endTime || "") ||
      instanceEditData.title !==
      (instance.customTitle || activeActivityTitle || ""));

  let containerClass =
    "flex flex-1 items-start gap-1 p-2 rounded-lg border transition-all relative group min-w-0 w-full";
  let checkBtnClass =
    "w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0 shadow-inner";

  if (isSuppressed) {
    containerClass += " bg-slate-100";
    containerClass += isModified
      ? " border-yellow-500 border-2 shadow-sm"
      : " border-slate-300";
    checkBtnClass +=
      " border border-slate-300 bg-slate-50 cursor-not-allowed opacity-50 text-transparent";
  } else if (isEditing) {
    containerClass += " bg-yellow-50 border-yellow-300 shadow-md";
    checkBtnClass +=
      " border border-yellow-300 bg-white text-transparent opacity-50";
  } else {
    containerClass += " bg-blue-50";
    containerClass += isModified
      ? " border-yellow-500 border-2 shadow-sm"
      : " border-blue-200";
    checkBtnClass += " bg-white border border-blue-200 hover:bg-blue-100";
  }

  const inputBaseClass =
    "rounded px-1 py-0.5 text-xs font-bold transition-all focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm min-h-[24px]";
  const inputEditClass = "bg-white border border-yellow-300 text-slate-800";
  const textColorClass = isSuppressed
    ? "text-slate-400"
    : isModified
      ? "text-blue-900"
      : "text-slate-700";
  const finalInputClass = isEditing
    ? inputEditClass
    : `bg-transparent border-transparent cursor-default pointer-events-none ${textColorClass}`;

  const startDate = instance.date || "";
  const startTime = instance.startTime || "";
  const endTime = instance.endTime || "";

  const rawTitle =
    instance.customTitle ||
    (isMultiRecurring ? "Bez názvu" : activeActivityTitle || "Bez názvu");

  const title = isSuppressed
    ? rawTitle
    : rawTitle
      .replace(/<d>/g, String(currentDValue))
      .replace(/<s>/g, String(totalSValue))
      .replace(/<n>/g, activeActivityTitle || "");

  let displayEndDateRaw = instance.endDate || instance.date;

  if (
    startTime &&
    endTime &&
    startTime > endTime &&
    instance.date === displayEndDateRaw
  ) {
    const date = new Date(instance.date);
    date.setDate(date.getDate() + 1);
    displayEndDateRaw = date.toISOString().split("T")[0];
  }

  const endDate = displayEndDateRaw || "";

  const timeString =
    instance.date !== displayEndDateRaw
      ? `${startDate} ${startTime} - ${endDate} ${endTime}`
      : startTime && endTime
        ? `${startDate} ${startTime} - ${endTime}`
        : startTime
          ? `${startDate} ${startTime}`
          : startDate;

  return (
    <div className="flex items-start gap-0.5 w-full min-w-0">
      <div className={containerClass}>
        <button
          type="button"
          onClick={() =>
            !isSuppressed &&
            !isEditing &&
            onToggleComplete(instance.id)
          }
          disabled={isSuppressed || isEditing}
          className={checkBtnClass}
        >
          {!isSuppressed &&
            !isEditing &&
            (instance.completed ? (
              <Check
                className="w-4 h-4 text-green-600"
                strokeWidth={3}
              />
            ) : (
              <X
                className="w-4 h-4 text-red-500"
                strokeWidth={3}
              />
            ))}
        </button>

        {isEditing ? (
          <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
            <input
              type="date"
              value={instanceEditData.date}
              onChange={(event) =>
                onEditDataChange({
                  ...instanceEditData,
                  date: event.target.value,
                })
              }
              className={`${inputBaseClass} ${finalInputClass} w-24`}
            />

            <input
              type="time"
              value={instanceEditData.startTime}
              onChange={(event) =>
                onEditDataChange({
                  ...instanceEditData,
                  startTime: event.target.value,
                })
              }
              className={`${inputBaseClass} ${finalInputClass} w-[72px] text-center px-0`}
            />

            <ArrowRight
              className={`w-3 h-3 shrink-0 ${isSuppressed
                  ? "text-slate-300"
                  : "text-yellow-600"
                }`}
            />

            <input
              type="date"
              value={instanceEditData.endDate}
              onChange={(event) =>
                onEditDataChange({
                  ...instanceEditData,
                  endDate: event.target.value,
                })
              }
              className={`${inputBaseClass} ${finalInputClass} w-24`}
            />

            <input
              type="time"
              value={instanceEditData.endTime}
              onChange={(event) =>
                onEditDataChange({
                  ...instanceEditData,
                  endTime: event.target.value,
                })
              }
              className={`${inputBaseClass} ${finalInputClass} w-[72px] text-center px-0`}
            />

            <textarea
              ref={activeInstanceTextareaRef}
              value={instanceEditData.title}
              onChange={(event) =>
                onEditDataChange({
                  ...instanceEditData,
                  title: event.target.value,
                })
              }
              className={`${inputBaseClass} ${finalInputClass} flex-1 min-w-[120px] resize-none overflow-hidden leading-normal`}
              rows={1}
              onInput={(event) => {
                event.currentTarget.style.height = "auto";
                event.currentTarget.style.height = `${event.currentTarget.scrollHeight + 2}px`;
              }}
            />

            <div className="flex gap-1 ml-auto shrink-0">
              {hasInstanceChanges && (
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="p-1 bg-yellow-400 hover:bg-yellow-50 text-yellow-900 rounded shadow-sm animate-in zoom-in duration-200"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={onCancelEdit}
                className="p-1 bg-white border border-yellow-300 text-slate-500 hover:text-red-600 rounded shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`py-1 px-1 flex-1 flex flex-col justify-center min-w-0 ${textColorClass}`}
            >
              <div className="text-xs font-bold leading-normal whitespace-pre-wrap break-words">
                {timeString} {title}
              </div>

              <RecurrenceInstanceAttachments
                instance={instance}
                sharedNotes={sharedNotes}
                onOpenNote={onOpenNote}
              />
            </div>

            <div className="absolute right-1 top-[3px] flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-md border border-slate-200 z-10">
              {isModified && (
                <button
                  type="button"
                  onClick={(event) =>
                    onRestore(event, instance.id)
                  }
                  className="p-1.5 hover:bg-yellow-100 text-yellow-600 rounded transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onStartEdit(instance);
                }}
                className="p-1.5 hover:bg-blue-100 text-slate-500 rounded transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSuppression(instance.id);
                }}
                className={`p-1.5 rounded transition-colors ${isSuppressed
                    ? "hover:bg-green-100 text-slate-500"
                    : "hover:bg-slate-100 text-slate-500"
                  }`}
              >
                {isSuppressed ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <Ban className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};