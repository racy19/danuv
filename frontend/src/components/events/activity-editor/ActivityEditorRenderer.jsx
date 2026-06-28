import { ActivityEditorModal } from "./ActivityEditorModal";
import { SingleActivityDateFields } from "./recurrence/SingleActivityDateFields";
import { sortRecurrenceInstances } from "../../../utils/recurrenceUtils";
import { RecurrenceEditor } from "./recurrence/RecurrenceEditor";
import { buildActivityAttachments, computeActivityHasChanges } from "../../../utils/activityEditorUtils";

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
    areSetsEqual,
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
}) => {
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

    const activityEditorModalProps = {
        isOpen: isActivityEditorOpen,
        onClose: () => setIsActivityEditorOpen(false),
        contentRef: activityEditorRef,
        zIndexStyle: { zIndex: editorZIndices.activity },

        headerProps: {
            activityType: activityState.type,
            multiDefs: activityState.multiDefs,
            hasChanges,
            onActivityTypeChange: activitySetters.setType,
            onMultiDefsChange: activitySetters.setMultiDefs,
            onSave: handleSaveActivity,
        },

        basicFieldsProps: {
            title: activityState.title,
            completed: activityState.completed,
            showNameHelp,
            nameHelpRef,
            titleRef: activityTitleRef,
            onTitleChange: activitySetters.setTitle,
            onCompletedChange: activitySetters.setCompleted,
            onShowNameHelpChange: setShowNameHelp,
        },

        attachmentsProps: {
            show: activityState.type === "single",
            attachments: allAttachments,
            searchResults,
            linkedIds: tempActivityLinks,
            searchQuery: linkSearchQuery,
            isDropdownOpen: isLinkDropdownOpen,
            dropdownRef: activityLinkDropdownRef,
            onSearchQueryChange: setLinkSearchQuery,
            onOpenDropdown: () => setIsLinkDropdownOpen(true),
            onToggleAttachment: handleInlineNoteToggleForActivity,
            onOpenNote: handleOpenNoteEditor,
            onOpenProject: handleOpenProjectEditor,
        },
    };

    const recurrenceEditorProps = {
        isMultiRecurring,
        startTime: activityState.startTime,
        endTime: activityState.endTime,
        intervalStart: activityState.intervalStart,
        intervalEnd: activityState.intervalEnd,

        pattern: activityState.recurrencePattern,
        interval: activityState.recurrenceInterval,
        unit: activityState.recurrenceUnit,
        days: activityState.recurrenceDays,
        weeks: activityState.recurrenceWeeks,

        multiDefs: activityState.multiDefs,

        currentInstances: currentRecurrenceInstances,
        sortedInstances: sortedInstancesForEditor,
        sourceTotals: sourceTotalsEditor,

        recurrenceNeedsUpdate,

        editingInstanceId,
        instanceEditData,
        activeActivityTitle: activityState.title,
        sharedNotes,

        showNameHelp,
        nameHelpRef,
        activeInstanceTextareaRef,

        onStartTimeChange: activitySetters.setStartTime,
        onEndTimeChange: activitySetters.setEndTime,
        onIntervalStartChange: activitySetters.setIntervalStart,
        onIntervalEndChange: activitySetters.setIntervalEnd,

        onPatternChange: handleRecurrencePatternChange,
        onIntervalChange: activitySetters.setRecurrenceInterval,
        onUnitChange: activitySetters.setRecurrenceUnit,
        onToggleDay: toggleRecurrenceDay,
        onToggleWeek: toggleRecurrenceWeek,

        onMultiDefsChange: activitySetters.setMultiDefs,
        onShowNameHelpChange: setShowNameHelp,

        onRegenerate: handleManualRegeneration,
        onRevertChanges: handleRevertRecurrenceChanges,

        onToggleComplete: toggleRecurrenceInstanceComplete,
        onEditDataChange: setInstanceEditData,
        onSaveEdit: saveEditingInstance,
        onCancelEdit: cancelEditingInstance,
        onStartEdit: startEditingInstance,
        onRestore: restoreRecurrenceInstance,
        onToggleSuppression: toggleRecurrenceInstanceSuppression,
        onOpenNote: handleOpenNoteEditor,
    };

    const singleActivityDateFieldsProps = {
        startDate: activityState.start,
        endDate: activityState.end,
        startTime: activityState.startTime,
        endTime: activityState.endTime,
        onStartDateChange: activitySetters.setStart,
        onEndDateChange: activitySetters.setEnd,
        onStartTimeChange: activitySetters.setStartTime,
        onEndTimeChange: activitySetters.setEndTime,
    };

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