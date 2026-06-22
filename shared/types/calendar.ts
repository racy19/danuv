export type Id = string | number;

export type CalendarItemType = "event" | "task" | "project";

export type ActivityType = "single" | "recurring" | "multi_recurring";

export type DateString = string; // YYYY-MM-DD
export type TimeString = string; // HH:mm

export interface BaseCalendarItem {
	id: Id;
	title: string;
	type: CalendarItemType;

	completed: boolean;

	start?: DateString;
	end?: DateString;
	startTime?: TimeString;
	endTime?: TimeString;

	isPinned?: boolean;
	isHidden?: boolean;

	linkedNoteIds?: Id[];
	subtasks?: CalendarItem[];
}

export interface EventItem extends BaseCalendarItem {
	type: "event";
	activityType?: ActivityType;
}

export interface TaskItem extends BaseCalendarItem {
	type: "task";
}

export interface ProjectItem extends BaseCalendarItem {
	type: "project";
}

export type RecurrencePattern =
	| "daily"
	| "weekly"
	| "monthly"
	| "yearly"
	| "custom";

export type RecurrenceUnit = "day" | "week" | "month" | "year";

export type WeekParity = "odd" | "even";

export interface MultiRecurringDefinition {
	startTime?: TimeString;
	endTime?: TimeString;
	title?: string;
}

export interface RecurrenceInstance {
	id: Id;

	date: DateString;
	originalDate?: DateString;
	endDate?: DateString;

	startTime?: TimeString;
	endTime?: TimeString;

	completed: boolean;

	isGenerated?: boolean;
	isSuppressed?: boolean;
	isEdited?: boolean;
	isHidden?: boolean;

	customTitle?: string | null;

	linkedNoteIds?: Id[];
	subtasks?: CalendarItem[];

	parentId?: Id;
	isInstance?: boolean;

	/**
	 * Temporary helper from the current implementation.
	 * Used for matching multi-recurring generated instances.
	 */
	_sourceIdx?: number;
}

export interface RecurringFields {
	activityType: "recurring" | "multi_recurring";

	intervalStart: DateString;
	intervalEnd: DateString;

	recurrencePattern: RecurrencePattern;
	recurrenceInterval?: number;
	recurrenceUnit?: RecurrenceUnit;

	recurrenceDays?: number[]; // 0 = Sunday, 1 = Monday...
	recurrenceWeeks?: WeekParity[];

	recurrenceInstances?: RecurrenceInstance[];

	multiDefs?: MultiRecurringDefinition[];
}

export type RecurringEventItem = EventItem & RecurringFields;

export type CalendarItem =
	| EventItem
	| TaskItem
	| ProjectItem
	| RecurringEventItem;

export type RenderableCalendarItem = CalendarItem & {
	isInstance?: boolean;
	parentId?: Id;
	isGenerated?: boolean;
	isSuppressed?: boolean;
};