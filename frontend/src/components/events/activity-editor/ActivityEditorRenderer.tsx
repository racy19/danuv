import type { RefObject } from "react";

import type {
    CalendarItem,
    Id,
    MultiRecurringDefinition,
    Note,
    RecurrenceInstance,
    RecurrencePattern,
    RecurrenceUnit,
    WeekParity,
} from "../../../../../shared/types";

import { ActivityEditorModal } from "./ActivityEditorModal";
import { SingleActivityDateFields } from "./recurrence/SingleActivityDateFields";
import { getRecurrenceEditorData } from "../../../utils/recurrenceUtils";
import { RecurrenceEditor } from "./recurrence/RecurrenceEditor";
import {
    buildActivityAttachments,
    computeActivityHasChanges,
} from "../../../utils/activityEditorUtils";
import {
    buildActivityEditorModalProps,
    buildRecurrenceEditorProps,
    buildSingleActivityDateFieldsProps,
    InstanceEditData,
} from "./hooks/useActivityEditorProps";

type ActivityState = {
    id: Id | null;
    title: string;
    start: string;
    end: string;
    startTime: string;
    endTime: string;
    completed: boolean;
    type: "single" | "recurring" | "multi_recurring";

    intervalStart: string;
    intervalEnd: string;
    recurrencePattern: RecurrencePattern;
    recurrenceInterval: number;
    recurrenceUnit: RecurrenceUnit;
    recurrenceDays: number[];
    recurrenceWeeks: WeekParity[];
    multiDefs: MultiRecurringDefinition[];
};

type ActivitySetters = {
    setTitle: (value: string) => void;
    setStart: (value: string) => void;
    setEnd: (value: string) => void;
    setStartTime: (value: string) => void;
    setEndTime: (value: string) => void;
    setCompleted: (value: boolean) => void;
    setType: (value: ActivityState["type"]) => void;
    setIntervalStart: (value: string) => void;
    setIntervalEnd: (value: string) => void;
    setRecurrenceInterval: (value: number) => void;
    setRecurrenceUnit: (value: RecurrenceUnit) => void;
    setMultiDefs: (value: MultiRecurringDefinition[]) => void;
};

type ActivityEditorRendererProps = {
    isActivityEditorOpen: boolean;
    sharedNotes: Record<Id, Note>;
    events: CalendarItem[];
    linkSearchQuery: string;
    tempActivityLinks: Set<Id>;

    findItemAndParent: (
        items: CalendarItem[],
        id: Id | null
    ) => { item: CalendarItem } | null;

    currentRecurrenceInstances: RecurrenceInstance[];
    activityState: ActivityState;
    activitySetters: ActivitySetters;

    tempStatusChanges: Record<Id, unknown>;
    editorZIndices: { activity: number };
    activityEditorRef: RefObject<HTMLDivElement | null>;
    setIsActivityEditorOpen: (value: boolean) => void;

    showNameHelp: boolean;
    nameHelpRef: RefObject<HTMLDivElement | null>;
    activityTitleRef: RefObject<HTMLTextAreaElement | null>;
    setShowNameHelp: (value: boolean) => void;
    handleSaveActivity: () => void;

    isLinkDropdownOpen: boolean;
    activityLinkDropdownRef: RefObject<HTMLDivElement | null>;
    setLinkSearchQuery: (value: string) => void;
    setIsLinkDropdownOpen: (value: boolean) => void;
    handleInlineNoteToggleForActivity: (id: Id, shouldLink: boolean) => void;
    handleOpenNoteEditor: (id: Id) => void;
    handleOpenProjectEditor: (id: Id) => void;

    recurrenceNeedsUpdate: boolean;
    editingInstanceId: Id | null;
    instanceEditData: InstanceEditData;
    activeInstanceTextareaRef: RefObject<HTMLTextAreaElement | null>;

    handleRecurrencePatternChange: (pattern: string) => void;
    toggleRecurrenceDay: (dayIndex: number) => void;
    toggleRecurrenceWeek: (week: string) => void;
    handleManualRegeneration: () => void;
    handleRevertRecurrenceChanges: (
        event: React.MouseEvent<HTMLButtonElement>
    ) => void;
    toggleRecurrenceInstanceComplete: (id: Id) => void;
    setInstanceEditData: (data: InstanceEditData) => void;
    saveEditingInstance: () => void;
    cancelEditingInstance: () => void;
    startEditingInstance: (instance: RecurrenceInstance) => void;
    restoreRecurrenceInstance: (
        event: React.MouseEvent<HTMLButtonElement>,
        id: Id
    ) => void;
    toggleRecurrenceInstanceSuppression: (id: Id) => void;
};

export const ActivityEditorRenderer = ({
    isActivityEditorOpen,
    sharedNotes,
    events,
    linkSearchQuery,
    tempActivityLinks,
    findItemAndParent,
    currentRecurrenceInstances,
    activityState,
    activitySetters,
    tempStatusChanges,
    editorZIndices,
    activityEditorRef,
    setIsActivityEditorOpen,

    showNameHelp,
    nameHelpRef,
    activityTitleRef,
    setShowNameHelp,
    handleSaveActivity,

    isLinkDropdownOpen,
    activityLinkDropdownRef,
    setLinkSearchQuery,
    setIsLinkDropdownOpen,
    handleInlineNoteToggleForActivity,
    handleOpenNoteEditor,
    handleOpenProjectEditor,

    recurrenceNeedsUpdate,
    editingInstanceId,
    instanceEditData,
    activeInstanceTextareaRef,
    handleRecurrencePatternChange,
    toggleRecurrenceDay,
    toggleRecurrenceWeek,
    handleManualRegeneration,
    handleRevertRecurrenceChanges,
    toggleRecurrenceInstanceComplete,
    setInstanceEditData,
    saveEditingInstance,
    cancelEditingInstance,
    startEditingInstance,
    restoreRecurrenceInstance,
    toggleRecurrenceInstanceSuppression,
}: ActivityEditorRendererProps) => {
    if (!isActivityEditorOpen) return null;

    const { searchResults, allAttachments } = buildActivityAttachments({
        sharedNotes,
        events,
        linkSearchQuery,
        tempActivityLinks,
    });

    const foundObj = findItemAndParent(events, activityState.id);
    const originalActivity = foundObj ? foundObj.item : null;

    const hasChanges = computeActivityHasChanges({
        activityState,
        originalActivity,
        tempActivityLinks,
        tempStatusChanges,
        currentRecurrenceInstances,
    });

    const isRecurring = activityState.type === "recurring";
    const isMultiRecurring = activityState.type === "multi_recurring";

    const {
        sortedInstances: sortedInstancesForEditor,
        sourceTotals: sourceTotalsEditor,
    } = getRecurrenceEditorData(currentRecurrenceInstances);

    const activityEditorModalProps = buildActivityEditorModalProps({
        isActivityEditorOpen,
        editorZIndices,
        activityEditorRef,
        setIsActivityEditorOpen,
        activityState,
        hasChanges,
        showNameHelp,
        nameHelpRef,
        activityTitleRef,
        activitySetters,
        setShowNameHelp,
        handleSaveActivity,
        allAttachments,
        searchResults,
        tempActivityLinks,
        linkSearchQuery,
        isLinkDropdownOpen,
        activityLinkDropdownRef,
        setLinkSearchQuery,
        setIsLinkDropdownOpen,
        handleInlineNoteToggleForActivity,
        handleOpenNoteEditor,
        handleOpenProjectEditor,
    });

    const recurrenceEditorProps = buildRecurrenceEditorProps({
        activityState,
        activitySetters,

        isMultiRecurring,

        currentRecurrenceInstances,
        sortedInstancesForEditor,
        sourceTotalsEditor,

        recurrenceNeedsUpdate,

        editingInstanceId,
        instanceEditData,
        sharedNotes,
        showNameHelp,
        nameHelpRef,
        activeInstanceTextareaRef,

        handleRecurrencePatternChange,
        toggleRecurrenceDay,
        toggleRecurrenceWeek,
        handleManualRegeneration,
        handleRevertRecurrenceChanges,
        toggleRecurrenceInstanceComplete,
        setInstanceEditData,
        saveEditingInstance,
        cancelEditingInstance,
        startEditingInstance,
        restoreRecurrenceInstance,
        toggleRecurrenceInstanceSuppression,
        handleOpenNoteEditor,
    });

    const singleActivityDateFieldsProps = buildSingleActivityDateFieldsProps(
        activityState,
        activitySetters
    );

    return (
        <ActivityEditorModal
            {...activityEditorModalProps}
            body={
                isRecurring || isMultiRecurring ? (
                    <RecurrenceEditor {...recurrenceEditorProps} />
                ) : (
                    <SingleActivityDateFields
                        {...singleActivityDateFieldsProps}
                    />
                )
            }
        />
    );
};