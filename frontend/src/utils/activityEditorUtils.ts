import type { CalendarItem, Id } from "../../../shared/types";
import { areSetsEqual } from "./commonUtils";

type ActivityEditorState = {
  title: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  type: string;

  intervalStart: string;
  intervalEnd: string;
  recurrencePattern: string;
  recurrenceInterval: number;
  recurrenceUnit: string;
  recurrenceDays: number[];
  recurrenceWeeks: string[];
  multiDefs: unknown[];
};

type ComputeActivityHasChangesParams = {
  activityState: ActivityEditorState;
  originalActivity: EditableActivityItem | null;
  tempActivityLinks: Set<string | number>;
  tempStatusChanges: Record<string | number, unknown>;
  currentRecurrenceInstances: unknown[];
};

type EditableActivityItem = CalendarItem & {
  activityType?: string;
  intervalStart?: string;
  intervalEnd?: string;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceUnit?: string;
  recurrenceDays?: number[];
  recurrenceWeeks?: string[];
  recurrenceInstances?: unknown[];
  multiDefs?: unknown[];
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

  const originalInstancesStr = JSON.stringify(
    originalActivity ? originalActivity.recurrenceInstances || [] : []
  );

  const currentInstancesStr = JSON.stringify(currentRecurrenceInstances);
  const instancesChanged = originalInstancesStr !== currentInstancesStr;

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
          activityState.multiDefs.some((definition: any) =>
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

type BuildActivityAttachmentsParams = {
  sharedNotes: Record<string, any>;
  events: any[];
  linkSearchQuery: string;
  tempActivityLinks: Set<Id>;
};

export const buildActivityAttachments = ({
  sharedNotes,
  events,
  linkSearchQuery,
  tempActivityLinks,
}: BuildActivityAttachmentsParams) => {
  const noteResults = Object.values(sharedNotes)
    .filter((note: any) =>
      note.title.toLowerCase().includes(linkSearchQuery.toLowerCase())
    )
    .map((note: any) => ({
      ...note,
      _type: "note",
    }));

  const projectResults = events
    .filter(
      (event: any) =>
        event.type === "project" &&
        event.title
          .toLowerCase()
          .includes(linkSearchQuery.toLowerCase())
    )
    .map((project: any) => ({
      ...project,
      _type: "project",
    }));

  const searchResults = [...noteResults, ...projectResults];

  const allAttachments = Array.from(tempActivityLinks)
    .map((id) => {
      const note = sharedNotes[id];
      if (note) return { ...note, _type: "note" };

      const project = events.find(
        (event: any) => event.id === id && event.type === "project"
      );

      if (project) return { ...project, _type: "project" };

      return null;
    })
    .filter(Boolean);

  return {
    searchResults,
    allAttachments,
  };
};