type ActivityStateForSingleDateFields = {
  start: string;
  end: string;
  startTime: string;
  endTime: string;
};

type ActivitySettersForSingleDateFields = {
  setStart: (value: string) => void;
  setEnd: (value: string) => void;
  setStartTime: (value: string) => void;
  setEndTime: (value: string) => void;
};

export const buildSingleActivityDateFieldsProps = (
  activityState: ActivityStateForSingleDateFields,
  activitySetters: ActivitySettersForSingleDateFields
) => {
  return {
    startDate: activityState.start,
    endDate: activityState.end,
    startTime: activityState.startTime,
    endTime: activityState.endTime,
    onStartDateChange: activitySetters.setStart,
    onEndDateChange: activitySetters.setEnd,
    onStartTimeChange: activitySetters.setStartTime,
    onEndTimeChange: activitySetters.setEndTime,
  };
};

type BuildActivityEditorModalPropsParams = {
  isActivityEditorOpen: boolean;
  editorZIndices: { activity: number };
  activityEditorRef: React.RefObject<HTMLDivElement | null>;
  setIsActivityEditorOpen: (value: boolean) => void;

  activityState: any;
  hasChanges: boolean;

  showNameHelp: boolean;
  nameHelpRef?: React.RefObject<HTMLDivElement | null>;
  activityTitleRef?: React.RefObject<HTMLTextAreaElement | null>;

  activitySetters: any;
  setShowNameHelp: (value: boolean) => void;
  handleSaveActivity: () => void;

  allAttachments: any[];
  searchResults: any[];
  tempActivityLinks: Set<any>;
  linkSearchQuery: string;
  isLinkDropdownOpen: boolean;
  activityLinkDropdownRef?: React.RefObject<HTMLDivElement | null>;
  setLinkSearchQuery: (value: string) => void;
  setIsLinkDropdownOpen: (value: boolean) => void;
  handleInlineNoteToggleForActivity: (...args: any[]) => void;
  handleOpenNoteEditor: (...args: any[]) => void;
  handleOpenProjectEditor: (...args: any[]) => void;
};

export const buildActivityEditorModalProps = ({
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
}: BuildActivityEditorModalPropsParams) => ({
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
});

type BuildRecurrenceEditorPropsParams = {
  activityState: any;
  activitySetters: any;

  isMultiRecurring: boolean;

  currentRecurrenceInstances: any[];
  sortedInstancesForEditor: any[];
  sourceTotalsEditor: Record<number, number>;

  recurrenceNeedsUpdate: boolean;

  editingInstanceId: string | number | null;
  instanceEditData: any;
  sharedNotes: any;
  showNameHelp: boolean;
  nameHelpRef?: React.RefObject<HTMLDivElement | null>;
  activeInstanceTextareaRef?: React.RefObject<HTMLTextAreaElement | null>;

  handleRecurrencePatternChange: (...args: any[]) => void;
  toggleRecurrenceDay: (...args: any[]) => void;
  toggleRecurrenceWeek: (...args: any[]) => void;
  handleManualRegeneration: () => void;
  handleRevertRecurrenceChanges: (...args: any[]) => void;
  toggleRecurrenceInstanceComplete: (...args: any[]) => void;
  setInstanceEditData: (...args: any[]) => void;
  saveEditingInstance: () => void;
  cancelEditingInstance: () => void;
  startEditingInstance: (...args: any[]) => void;
  restoreRecurrenceInstance: (...args: any[]) => void;
  toggleRecurrenceInstanceSuppression: (...args: any[]) => void;
  handleOpenNoteEditor: (...args: any[]) => void;
};

export const buildRecurrenceEditorProps = ({
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
}: BuildRecurrenceEditorPropsParams) => ({
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
  onShowNameHelpChange: activitySetters.setShowNameHelp ?? (() => { }),

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
});