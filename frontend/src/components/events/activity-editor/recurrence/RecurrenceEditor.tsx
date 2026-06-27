import type { RefObject } from "react";

import type {
    Id,
    MultiRecurringDefinition,
    Note,
    RecurrenceInstance,
    RecurrencePattern,
    RecurrenceUnit,
    WeekParity,
} from "../../../../../../shared/types";

import { RecurrenceDateRange } from "./RecurrenceDateRange";
import { RecurrencePatternEditor } from "./RecurrencePatternEditor";
import { MultiRecurringDefsEditor } from "./MultiRecurringDefsEditor";
import { RecurrenceInstancesList } from "./RecurrenceInstancesList";
import { RecurrenceInstanceRow } from "./RecurrenceInstanceRow";

type InstanceEditData = {
    title: string;
    date: string;
    endDate: string;
    startTime: string;
    endTime: string;
};

type Props = {
    isMultiRecurring: boolean;

    startTime: string;
    endTime: string;
    intervalStart: string;
    intervalEnd: string;

    pattern: RecurrencePattern;
    interval: number;
    unit: RecurrenceUnit;
    days: number[];
    weeks: WeekParity[];

    multiDefs: MultiRecurringDefinition[];

    currentInstances: RecurrenceInstance[];
    sortedInstances: RecurrenceInstance[];
    sourceTotals: Record<number, number>;

    recurrenceNeedsUpdate: boolean;

    editingInstanceId: Id | null;
    instanceEditData: InstanceEditData;
    activeActivityTitle: string;
    sharedNotes: Record<Id, Note>;

    showNameHelp: boolean;
    nameHelpRef?: RefObject<HTMLDivElement | null>;
    activeInstanceTextareaRef?: RefObject<HTMLTextAreaElement | null>;

    onStartTimeChange: (value: string) => void;
    onEndTimeChange: (value: string) => void;
    onIntervalStartChange: (value: string) => void;
    onIntervalEndChange: (value: string) => void;

    onPatternChange: (pattern: RecurrencePattern) => void;
    onIntervalChange: (interval: number) => void;
    onUnitChange: (unit: RecurrenceUnit) => void;
    onToggleDay: (dayIndex: number) => void;
    onToggleWeek: (week: WeekParity) => void;

    onMultiDefsChange: (defs: MultiRecurringDefinition[]) => void;
    onShowNameHelpChange: (show: boolean) => void;

    onRegenerate: () => void;
    onRevertChanges: (event: React.MouseEvent<HTMLButtonElement>) => void;

    onToggleComplete: (instanceId: Id) => void;
    onEditDataChange: (data: InstanceEditData) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onStartEdit: (instance: RecurrenceInstance) => void;
    onRestore: (
        event: React.MouseEvent<HTMLButtonElement>,
        instanceId: Id
    ) => void;
    onToggleSuppression: (instanceId: Id) => void;
    onOpenNote: (noteId: Id) => void;
};

export const RecurrenceEditor = ({
    isMultiRecurring,

    startTime,
    endTime,
    intervalStart,
    intervalEnd,

    pattern,
    interval,
    unit,
    days,
    weeks,

    multiDefs,

    currentInstances,
    sortedInstances,
    sourceTotals,

    recurrenceNeedsUpdate,

    editingInstanceId,
    instanceEditData,
    activeActivityTitle,
    sharedNotes,

    showNameHelp,
    nameHelpRef,
    activeInstanceTextareaRef,

    onStartTimeChange,
    onEndTimeChange,
    onIntervalStartChange,
    onIntervalEndChange,

    onPatternChange,
    onIntervalChange,
    onUnitChange,
    onToggleDay,
    onToggleWeek,

    onMultiDefsChange,
    onShowNameHelpChange,

    onRegenerate,
    onRevertChanges,

    onToggleComplete,
    onEditDataChange,
    onSaveEdit,
    onCancelEdit,
    onStartEdit,
    onRestore,
    onToggleSuppression,
    onOpenNote,
}: Props) => {
    const sourceCurrents: Record<number, number> = {};

    return (
        <div className="animate-in fade-in slide-in-from-top-2 border-b border-blue-200 bg-blue-50/50 p-0 overflow-y-auto overflow-x-hidden w-full">
            <RecurrenceDateRange
                isMultiRecurring={isMultiRecurring}
                startTime={startTime}
                endTime={endTime}
                intervalStart={intervalStart}
                intervalEnd={intervalEnd}
                onStartTimeChange={onStartTimeChange}
                onEndTimeChange={onEndTimeChange}
                onIntervalStartChange={onIntervalStartChange}
                onIntervalEndChange={onIntervalEndChange}
            />

            <RecurrencePatternEditor
                pattern={pattern}
                interval={interval}
                unit={unit}
                days={days}
                weeks={weeks}
                onPatternChange={onPatternChange}
                onIntervalChange={onIntervalChange}
                onUnitChange={onUnitChange}
                onToggleDay={onToggleDay}
                onToggleWeek={onToggleWeek}
            />

            {isMultiRecurring && (
                <MultiRecurringDefsEditor
                    defs={multiDefs}
                    showNameHelp={showNameHelp}
                    nameHelpRef={nameHelpRef}
                    onDefsChange={onMultiDefsChange}
                    onShowNameHelpChange={onShowNameHelpChange}
                />
            )}

            <div className="h-px bg-blue-300 w-full my-3" />

            <RecurrenceInstancesList
                instancesCount={currentInstances.length}
                recurrenceNeedsUpdate={recurrenceNeedsUpdate}
                hasInstances={sortedInstances.length > 0}
                onRegenerate={onRegenerate}
                onRevertChanges={onRevertChanges}
            >
                {sortedInstances.map((instance) => {
                    const isSuppressed = Boolean(instance.isSuppressed);
                    const sourceIndex = instance._sourceIdx || 0;

                    if (!isSuppressed) {
                        sourceCurrents[sourceIndex] =
                            (sourceCurrents[sourceIndex] || 0) + 1;
                    }

                    return (
                        <RecurrenceInstanceRow
                            key={instance.id}
                            instance={instance}
                            isEditing={editingInstanceId === instance.id}
                            isMultiRecurring={isMultiRecurring}
                            activeActivityTitle={activeActivityTitle}
                            currentDValue={
                                isSuppressed
                                    ? ""
                                    : sourceCurrents[sourceIndex] || ""
                            }
                            totalSValue={
                                isSuppressed
                                    ? ""
                                    : sourceTotals[sourceIndex] || ""
                            }
                            instanceEditData={instanceEditData}
                            activeInstanceTextareaRef={
                                activeInstanceTextareaRef
                            }
                            sharedNotes={sharedNotes}
                            onToggleComplete={onToggleComplete}
                            onEditDataChange={onEditDataChange}
                            onSaveEdit={onSaveEdit}
                            onCancelEdit={onCancelEdit}
                            onStartEdit={onStartEdit}
                            onRestore={onRestore}
                            onToggleSuppression={onToggleSuppression}
                            onOpenNote={onOpenNote}
                        />
                    );
                })}
            </RecurrenceInstancesList>
        </div>
    );
};