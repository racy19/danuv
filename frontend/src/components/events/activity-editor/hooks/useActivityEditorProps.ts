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

type ActivityType = "single" | "recurring" | "multi_recurring";

export type ActivityEditorState = {
  id: Id | null;
  title: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  type: ActivityType;

  intervalStart: string;
  intervalEnd: string;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceUnit: RecurrenceUnit;
  recurrenceDays: number[];
  recurrenceWeeks: WeekParity[];
  multiDefs: MultiRecurringDefinition[];
};

export type ActivityEditorSetters = {
  setTitle: (value: string) => void;
  setStart: (value: string) => void;
  setEnd: (value: string) => void;
  setStartTime: (value: string) => void;
  setEndTime: (value: string) => void;
  setCompleted: (value: boolean) => void;
  setType: (value: ActivityType) => void;
  setIntervalStart: (value: string) => void;
  setIntervalEnd: (value: string) => void;
  setRecurrenceInterval: (value: number) => void;
  setRecurrenceUnit: (value: RecurrenceUnit) => void;
  setMultiDefs: (value: MultiRecurringDefinition[]) => void;
};

export type InstanceEditData = {
  title: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

type AttachmentItem = {
  id: Id;
  title: string;
  _type: "note" | "project";
  isSuppressed?: boolean;
};

export const buildSingleActivityDateFieldsProps = (
  activityState: Pick<ActivityEditorState, "start" | "end" | "startTime" | "endTime">,
  activitySetters: Pick<
    ActivityEditorSetters,
    "setStart" | "setEnd" | "setStartTime" | "setEndTime"
  >
) => ({
  startDate: activityState.start,
  endDate: activityState.end,
  startTime: activityState.startTime,
  endTime: activityState.endTime,
  onStartDateChange: activitySetters.setStart,
  onEndDateChange: activitySetters.setEnd,
  onStartTimeChange: activitySetters.setStartTime,
  onEndTimeChange: activitySetters.setEndTime,
});

type BuildActivityEditorModalPropsParams = {
  isActivityEditorOpen: boolean;
  editorZIndices: { activity: number };
  activityEditorRef: RefObject<HTMLDivElement | null>;
  setIsActivityEditorOpen: (value: boolean) => void;

  activityState: ActivityEditorState;
  hasChanges: boolean;

  showNameHelp: boolean;
  nameHelpRef?: RefObject<HTMLDivElement | null>;
  activityTitleRef?: RefObject<HTMLTextAreaElement | null>;

  activitySetters: ActivityEditorSetters;
  setShowNameHelp: (value: boolean) => void;
  handleSaveActivity: () => void;

  allAttachments: AttachmentItem[];
  searchResults: AttachmentItem[];
  tempActivityLinks: Set<Id>;
  linkSearchQuery: string;
  isLinkDropdownOpen: boolean;
  activityLinkDropdownRef?: RefObject<HTMLDivElement | null>;
  setLinkSearchQuery: (value: string) => void;
  setIsLinkDropdownOpen: (value: boolean) => void;
  handleInlineNoteToggleForActivity: (id: Id, shouldLink: boolean) => void;
  handleOpenNoteEditor: (id: Id) => void;
  handleOpenProjectEditor: (id: Id) => void;
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
  activityState: ActivityEditorState;
  activitySetters: ActivityEditorSetters;

  isMultiRecurring: boolean;

  currentRecurrenceInstances: RecurrenceInstance[];
  sortedInstancesForEditor: RecurrenceInstance[];
  sourceTotalsEditor: Record<number, number>;

  recurrenceNeedsUpdate: boolean;

  editingInstanceId: Id | null;
  instanceEditData: InstanceEditData;
  sharedNotes: Record<Id, Note>;
  showNameHelp: boolean;
  nameHelpRef?: RefObject<HTMLDivElement | null>;
  activeInstanceTextareaRef?: RefObject<HTMLTextAreaElement | null>;

  handleRecurrencePatternChange: (pattern: RecurrencePattern) => void;
  toggleRecurrenceDay: (dayIndex: number) => void;
  toggleRecurrenceWeek: (week: WeekParity) => void;
  handleManualRegeneration: () => void;
  handleRevertRecurrenceChanges: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
  handleOpenNoteEditor: (id: Id) => void;
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
  onShowNameHelpChange: () => { },

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