import type {
  CalendarItem,
  Id,
  MultiRecurringDefinition,
  Note,
  RecurrenceInstance,
  RecurrencePattern,
  RecurrenceUnit,
  WeekParity,
} from "../../../shared/types";
import { areSetsEqual } from "./commonUtils";

type ActivityEditorState = {
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

type EditableActivityItem = CalendarItem & {
  activityType?: "single" | "recurring" | "multi_recurring";
  intervalStart?: string;
  intervalEnd?: string;
  recurrencePattern?: RecurrencePattern;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  recurrenceDays?: number[];
  recurrenceWeeks?: WeekParity[];
  recurrenceInstances?: RecurrenceInstance[];
  multiDefs?: MultiRecurringDefinition[];
};

type ComputeActivityHasChangesParams = {
  activityState: ActivityEditorState;
  originalActivity: EditableActivityItem | null;
  tempActivityLinks: Set<Id>;
  tempStatusChanges: Record<Id, unknown>;
  currentRecurrenceInstances: RecurrenceInstance[];
};

export const computeActivityHasChanges = ({
  activityState,
  originalActivity,
  tempActivityLinks,
  tempStatusChanges,
  currentRecurrenceInstances,
}: ComputeActivityHasChangesParams): boolean => {
  const originalLinks = new Set(
    originalActivity ? originalActivity.linkedNoteIds || [] : []
  );

  const instancesChanged =
    JSON.stringify(originalActivity?.recurrenceInstances || []) !==
    JSON.stringify(currentRecurrenceInstances);

  const isNewActivity = !originalActivity;

  const baseChanges = isNewActivity
    ? false
    : activityState.title !== (originalActivity.title || "") ||
    activityState.start !== (originalActivity.start || "") ||
    activityState.end !== (originalActivity.end || "") ||
    activityState.startTime !== (originalActivity.startTime || "") ||
    activityState.endTime !== (originalActivity.endTime || "") ||
    activityState.completed !== (originalActivity.completed || false) ||
    activityState.type !== (originalActivity.activityType || "single") ||
    !areSetsEqual(tempActivityLinks, originalLinks) ||
    Object.keys(tempStatusChanges).length > 0;

  const recurringChanges =
    (activityState.type === "recurring" ||
      activityState.type === "multi_recurring") &&
      !isNewActivity
      ? activityState.intervalStart !==
      (originalActivity.intervalStart || "") ||
      activityState.intervalEnd !==
      (originalActivity.intervalEnd || "") ||
      activityState.recurrencePattern !==
      (originalActivity.recurrencePattern || "daily") ||
      activityState.recurrenceInterval !==
      (originalActivity.recurrenceInterval || 1) ||
      activityState.recurrenceUnit !==
      (originalActivity.recurrenceUnit || "day") ||
      !areSetsEqual(
        new Set(activityState.recurrenceDays),
        new Set(originalActivity.recurrenceDays || [])
      ) ||
      !areSetsEqual(
        new Set(activityState.recurrenceWeeks),
        new Set(originalActivity.recurrenceWeeks || ["odd", "even"])
      ) ||
      instancesChanged ||
      JSON.stringify(activityState.multiDefs) !==
      JSON.stringify(originalActivity.multiDefs || [])
      : false;

  if (isNewActivity) {
    return (
      activityState.title.length > 0 ||
      instancesChanged ||
      (activityState.type === "multi_recurring" &&
        (!!activityState.intervalStart ||
          !!activityState.intervalEnd ||
          activityState.multiDefs.some((definition) =>
            Boolean(
              definition.title ||
              definition.startTime ||
              definition.endTime
            )
          )))
    );
  }

  return baseChanges || recurringChanges;
};

type ProjectAttachmentItem = CalendarItem & {
  type: "project";
  _type: "project";
};

type NoteAttachmentItem = Note & {
  _type: "note";
};

export type ActivityAttachmentItem =
  | ProjectAttachmentItem
  | NoteAttachmentItem;

type BuildActivityAttachmentsParams = {
  sharedNotes: Record<Id, Note>;
  events: CalendarItem[];
  linkSearchQuery: string;
  tempActivityLinks: Set<Id>;
};

export const buildActivityAttachments = ({
  sharedNotes,
  events,
  linkSearchQuery,
  tempActivityLinks,
}: BuildActivityAttachmentsParams): {
  searchResults: ActivityAttachmentItem[];
  allAttachments: ActivityAttachmentItem[];
} => {
  const normalizedQuery = linkSearchQuery.toLowerCase();

  const noteResults: ActivityAttachmentItem[] = Object.values(sharedNotes)
    .filter((note) => note.title.toLowerCase().includes(normalizedQuery))
    .map((note) => ({
      ...note,
      _type: "note",
    }));

  const projectResults: ActivityAttachmentItem[] = events
    .filter((event): event is CalendarItem & { type: "project" } => {
      return (
        event.type === "project" &&
        event.title.toLowerCase().includes(normalizedQuery)
      );
    })
    .map((project) => ({
      ...project,
      _type: "project",
    }));

  const allAttachments = Array.from(tempActivityLinks)
    .map((id): ActivityAttachmentItem | null => {
      const note = sharedNotes[id];
      if (note) return { ...note, _type: "note" };

      const project = events.find(
        (event): event is CalendarItem & { type: "project" } =>
          event.id === id && event.type === "project"
      );

      if (project) return { ...project, _type: "project" };

      return null;
    })
    .filter((item): item is ActivityAttachmentItem => Boolean(item));

  return {
    searchResults: [...noteResults, ...projectResults],
    allAttachments,
  };
};