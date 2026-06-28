import type {
	ActivityType,
	MultiRecurringDefinition,
	RecurrenceInstance,
	RecurrencePattern,
	RecurrenceUnit,
	WeekParity,
} from "../../../shared/types/calendar";
import { getDateStr, getISOWeek } from "./dateUtils";

// --- Helpers for checking recurrence patterns ---

/**
 * Checks if a given date matches the specified weekly recurrence rules.
 *
 * @param date The date to check.
 * @param daysOfWeek An array of allowed days of the week (0=Sunday, 1=Monday, ..., 6=Saturday). If empty, all days are allowed.
 * @param weekParity An array specifying whether to include "odd" weeks, "even" weeks, or both. If empty, all weeks are allowed.
 * @returns True if the date matches the weekly recurrence rules, false otherwise.
 */
const isWeeklyMatch = (
	date: Date,
	daysOfWeek: number[],
	weekParity: WeekParity[]
): boolean => {
	const dayMatches =
		daysOfWeek.length === 0 || daysOfWeek.includes(date.getDay());

	const weekMatches =
		weekParity.length === 2 ||
		weekParity.includes(getISOWeek(date) % 2 !== 0 ? "odd" : "even");

	return dayMatches && weekMatches;
};

/**
 * Checks if a given date matches the specified recurrence pattern and rules.
 *
 * @param date The date to check.
 * @param pattern The recurrence pattern (daily, weekly, monthly, yearly, custom).
 * @param unit The unit for the interval (day, week, month, year).
 * @param daysOfWeek For weekly or custom patterns, the days of the week to include (0=Sun, 1=Mon, ..., 6=Sat).
 * @param weekParity For weekly patterns, whether to include odd/even weeks.
 * @returns True if the date matches the recurrence rules, false otherwise.
 */
const doesDateMatchPattern = (
	date: Date,
	pattern: RecurrencePattern,
	unit: RecurrenceUnit,
	daysOfWeek: number[],
	weekParity: WeekParity[]
): boolean => {
	switch (pattern) {
		case "daily":
		case "monthly":
		case "yearly":
			return true;

		case "weekly":
			return isWeeklyMatch(date, daysOfWeek, weekParity);

		case "custom":
			if (unit !== "week") {
				return true;
			}

			return daysOfWeek.length === 0 || daysOfWeek.includes(date.getDay());
	}
};

type GetNextDateParams = {
	currentDate: Date;
	pattern: RecurrencePattern;
	unit: RecurrenceUnit;
	interval: number;
	originalStartDay: number;
	originalStartMonth: number;
};

/**
 * Calculates the next date based on the current date and recurrence rules.
 *
 * @param currentDate The current date from which to calculate the next date.
 * @param pattern The recurrence pattern (daily, weekly, monthly, yearly, custom).
 * @param unit The unit for the interval (day, week, month, year).
 * @param interval The interval for custom patterns (e.g., every 2 weeks).
 * @param originalStartDay The original start day of the month (used for monthly/yearly patterns).
 * @param originalStartMonth The original start month (used for yearly patterns).
 * @returns The next date based on the recurrence rules.
 */
const getNextDate = ({
	currentDate,
	pattern,
	unit,
	interval,
	originalStartDay,
	originalStartMonth,
}: GetNextDateParams): Date => {
	const nextDate = new Date(currentDate);

	if (pattern === "daily" || pattern === "weekly") {
		nextDate.setDate(nextDate.getDate() + 1);
		return nextDate;
	}

	if (pattern === "monthly") {
		nextDate.setDate(1);
		nextDate.setMonth(nextDate.getMonth() + 1);

		const daysInMonth = new Date(
			nextDate.getFullYear(),
			nextDate.getMonth() + 1,
			0
		).getDate();

		nextDate.setDate(Math.min(originalStartDay, daysInMonth));
		return nextDate;
	}

	if (pattern === "yearly") {
		const nextYear = nextDate.getFullYear() + 1;

		nextDate.setFullYear(nextYear);
		nextDate.setMonth(originalStartMonth, 1);

		const daysInMonth = new Date(
			nextYear,
			originalStartMonth + 1,
			0
		).getDate();

		nextDate.setDate(Math.min(originalStartDay, daysInMonth));
		return nextDate;
	}

	if (pattern === "custom") {
		if (unit === "day") {
			nextDate.setDate(nextDate.getDate() + interval);
			return nextDate;
		}

		if (unit === "week") {
			nextDate.setDate(nextDate.getDate() + 1);
			return nextDate;
		}

		if (unit === "month") {
			nextDate.setDate(1);
			nextDate.setMonth(nextDate.getMonth() + interval);

			const daysInMonth = new Date(
				nextDate.getFullYear(),
				nextDate.getMonth() + 1,
				0
			).getDate();

			nextDate.setDate(Math.min(originalStartDay, daysInMonth));
			return nextDate;
		}

		if (unit === "year") {
			const nextYear = nextDate.getFullYear() + interval;

			nextDate.setFullYear(nextYear);
			nextDate.setMonth(originalStartMonth, 1);

			const daysInMonth = new Date(
				nextYear,
				originalStartMonth + 1,
				0
			).getDate();

			nextDate.setDate(Math.min(originalStartDay, daysInMonth));
			return nextDate;
		}
	}

	nextDate.setDate(nextDate.getDate() + 1);
	return nextDate;
};

type CreateInstancesForDateParams = {
	date: Date;
	baseStartTime?: string;
	baseEndTime?: string;
	multiDefs: MultiRecurringDefinition[];
};

/** * Creates recurrence instances for a specific date based on multi-recurring definitions.
 *
 * @param date The date for which to create instances.
 * @param baseStartTime Optional base start time for the instance (used if multiDefs is empty).
 * @param baseEndTime Optional base end time for the instance (used if multiDefs is empty).
 * @param multiDefs An array of definitions for multi-recurring patterns, each containing optional startTime, endTime, and title.
 * @returns An array of RecurrenceInstance objects created for the specified date.
 */
const createInstancesForDate = ({
	date,
	baseStartTime,
	baseEndTime,
	multiDefs,
}: CreateInstancesForDateParams): RecurrenceInstance[] => {
	const dateStr = getDateStr(date);

	const definitions =
		multiDefs.length > 0
			? multiDefs
			: [{ startTime: baseStartTime, endTime: baseEndTime, title: null }];

	return definitions.flatMap((definition, definitionIndex) => {
		const isMultiRecurring = multiDefs.length > 0;

		if (
			isMultiRecurring &&
			(!definition.title || definition.title.trim() === "")
		) {
			return [];
		}

		return [{
			id: `${dateStr}-${definitionIndex}-${Date.now()}-${Math.random()
				.toString(36)
				.substr(2, 9)}`,
			date: dateStr,
			originalDate: dateStr,
			endDate: dateStr,
			startTime: definition.startTime,
			endTime: definition.endTime,
			completed: false,
			isGenerated: true,
			isSuppressed: false,
			isEdited: false,
			customTitle: definition.title || null,
			subtasks: [],
			linkedNoteIds: [],
			isHidden: false,
			_sourceIdx: definitionIndex,
		}];
	});
};

export type RecurrenceValidationInput = {
	activityType: ActivityType;
	title: string;
	intervalStart: string;
	intervalEnd: string;
	multiDefs?: MultiRecurringDefinition[];
	recurrenceNeedsUpdate?: boolean;
	generatedInstancesCount?: number;
};

export const validateRecurrence = ({
	activityType,
	title,
	intervalStart,
	intervalEnd,
	multiDefs = [],
	recurrenceNeedsUpdate = false,
	generatedInstancesCount = 0,
}: RecurrenceValidationInput): string | null => {
	if (activityType !== "recurring" && activityType !== "multi_recurring") {
		return null;
	}

	if (activityType === "multi_recurring") {
		if (!title.trim()) {
			return "Nelze uložit: Vyplňte prosím název skupiny aktivit (červeně podbarvené pole).";
		}

		if (!intervalStart || !intervalEnd) {
			return "Nelze uložit: Vyplňte prosím datum začátku i konce intervalu.";
		}

		if (multiDefs.some((def) => !def.title || !def.title.trim())) {
			return "Nelze uložit: Vyplňte prosím názvy u všech přidružených aktivit uvnitř rozvrhu.";
		}
	}

	if (intervalStart && intervalEnd && intervalStart > intervalEnd) {
		return "Konec intervalu nemůže být před jeho začátkem!";
	}

	if (recurrenceNeedsUpdate) {
		return "Před uložením musíte vyřešit změnu intervalu (klikněte na 'Přegenerovat' nebo 'Vrátit změny').";
	}

	if (generatedInstancesCount === 0) {
		return "Nelze uložit: Podle zadaných parametrů nebyly vygenerovány žádné výskyty aktivit.";
	}

	return null;
};

export type SingleActivityValidationInput = {
	startDate: string;
	endDate: string;
	startTime: string;
	endTime: string;
};

export const validateSingleActivity = ({
	startDate,
	endDate,
	startTime,
	endTime,
}: SingleActivityValidationInput): string | null => {
	if (!startDate && (endDate || endTime)) {
		return "Nelze zadat konec události bez vyplněného data začátku!";
	}

	if (startDate && endDate) {
		if (startDate > endDate) {
			return "Datum konce nemůže být před datem začátku!";
		}

		if (
			startDate === endDate &&
			startTime &&
			endTime &&
			startTime > endTime
		) {
			return "Čas konce nemůže být před časem začátku!";
		}
	}

	return null;
};

export type RecurrenceSignatureInput = {
	intervalStart: string;
	intervalEnd: string;
	pattern: RecurrencePattern;
	interval: number;
	unit: RecurrenceUnit;
	days: number[];
	startTime?: string;
	endTime?: string;
	weeks: WeekParity[];
	multiDefs: MultiRecurringDefinition[];
};

export const createRecurrenceSignature = ({
	intervalStart,
	intervalEnd,
	pattern,
	interval,
	unit,
	days,
	startTime = "",
	endTime = "",
	weeks,
	multiDefs,
}: RecurrenceSignatureInput): string => {
	return JSON.stringify({
		start: intervalStart,
		end: intervalEnd,
		pattern,
		interval,
		unit,
		days: [...days].sort(),
		startTime,
		endTime,
		weeks: [...weeks].sort(),
		multiDefs,
	});
};

export type RecurrenceSignatureData = {
	start: string;
	end: string;
	pattern: RecurrencePattern;
	interval: number;
	unit: RecurrenceUnit;
	days: number[];
	startTime?: string;
	endTime?: string;
	weeks?: WeekParity[];
	multiDefs?: MultiRecurringDefinition[];
};

export const parseRecurrenceSignature = (
	signature: string
): RecurrenceSignatureData | null => {
	try {
		return JSON.parse(signature) as RecurrenceSignatureData;
	} catch {
		return null;
	}
};

export const hasRecurrenceStructureChanged = (
	original: RecurrenceSignatureData,
	current: RecurrenceSignatureInput
): boolean => {
	return (
		original.start !== current.intervalStart ||
		original.end !== current.intervalEnd ||
		original.pattern !== current.pattern ||
		original.interval !== current.interval ||
		original.unit !== current.unit ||
		JSON.stringify(original.days) !== JSON.stringify([...current.days].sort()) ||
		JSON.stringify(original.weeks || ["odd", "even"]) !== JSON.stringify([...current.weeks].sort()) ||
		(original.multiDefs || []).length !== current.multiDefs.length
	);
};

export const sortRecurrenceInstances = (
	instances: RecurrenceInstance[]
): RecurrenceInstance[] => {
	return [...instances].sort((a, b) => {
		const dateA = a.date || "";
		const dateB = b.date || "";

		if (dateA !== dateB) {
			return dateA.localeCompare(dateB);
		}

		return (a.startTime || "").localeCompare(b.startTime || "");
	});
};

// --- Main generator of recurrence instances ---

export interface GenerateRecurrenceInstancesParams {
	startStr: string;
	endStr: string;

	pattern: RecurrencePattern;
	interval: number;
	unit: RecurrenceUnit;

	daysOfWeek: number[];

	baseStartTime?: string;
	baseEndTime?: string;

	weekParity?: WeekParity[];
	multiDefs?: MultiRecurringDefinition[];
}

/**
 * Generates recurrence instances based on the provided pattern and rules.
 *
 * @param startStr The start date of the recurrence (inclusive) in YYYY-MM-DD format.
 * @param endStr The end date of the recurrence (inclusive) in YYYY-MM-DD format.
 * @param pattern The recurrence pattern (daily, weekly, monthly, yearly, custom).
 * @param interval The interval for custom patterns (e.g., every 2 weeks).
 * @param unit The unit for the interval (day, week, month, year).
 * @param daysOfWeek For weekly or custom patterns, the days of the week to include (0=Sun, 1=Mon, ..., 6=Sat).
 * @param baseStartTime Optional base start time for generated instances.
 * @param baseEndTime Optional base end time for generated instances.
 * @param weekParity For weekly patterns, whether to include odd/even weeks.
 * @param multiDefs For multi_recurring patterns, specific definitions for each instance (e.g., different times or titles).
 * @returns An array of generated RecurrenceInstance objects.
 */
export const generateRecurrenceInstances = ({
	startStr,
	endStr,
	pattern,
	interval,
	unit,
	daysOfWeek,
	baseStartTime,
	baseEndTime,
	weekParity = ["odd", "even"],
	multiDefs = [],
}: GenerateRecurrenceInstancesParams): RecurrenceInstance[] => {
	if (!startStr || !endStr) return [];

	const start = new Date(startStr);
	const end = new Date(endStr);
	const instances: RecurrenceInstance[] = [];

	start.setHours(12, 0, 0, 0);
	end.setHours(12, 0, 0, 0);

	let currentDate = new Date(start);
	const originalStartDay = start.getDate();
	const originalStartMonth = start.getMonth();

	let safetyCounter = 0;

	while (currentDate <= end && safetyCounter < 1000) {
		safetyCounter++;

		const dateMatchesPattern = doesDateMatchPattern(
			currentDate,
			pattern,
			unit,
			daysOfWeek,
			weekParity
		);

		if (dateMatchesPattern) {
			instances.push(
				...createInstancesForDate({
					date: currentDate,
					baseStartTime,
					baseEndTime,
					multiDefs,
				})
			);
		}

		currentDate = getNextDate({
			currentDate,
			pattern,
			unit,
			interval,
			originalStartDay,
			originalStartMonth,
		});
	}
	return instances;
};

export type RecurrenceEditorStateForGeneration = {
	activityType: ActivityType;

	intervalStart: string;
	intervalEnd: string;

	pattern: RecurrencePattern;
	interval: number;
	unit: RecurrenceUnit;

	days: number[];

	startTime?: string;
	endTime?: string;

	weeks: WeekParity[];
	multiDefs: MultiRecurringDefinition[];
};

export const buildRecurrenceGenerationInput = ({
	activityType,
	intervalStart,
	intervalEnd,
	pattern,
	interval,
	unit,
	days,
	startTime,
	endTime,
	weeks,
	multiDefs,
}: RecurrenceEditorStateForGeneration): GenerateRecurrenceInstancesParams => {
	return {
		startStr: intervalStart,
		endStr: intervalEnd,
		pattern,
		interval,
		unit,
		daysOfWeek: days,
		baseStartTime: startTime,
		baseEndTime: endTime,
		weekParity: weeks,
		multiDefs: activityType === "multi_recurring" ? multiDefs : [],
	};
};

export const normalizeMultiDefs = (
	multiDefs?: MultiRecurringDefinition[]
): MultiRecurringDefinition[] => {
	const normalized = (multiDefs || [])
		.map((definition) => ({
			startTime: definition.startTime || "",
			endTime: definition.endTime || "",
			title: (definition.title || "").trim(),
		}))
		.filter(
			(definition) =>
				definition.title ||
				definition.startTime ||
				definition.endTime
		);

	if (normalized.length === 0) {
		return [
			{
				startTime: "",
				endTime: "",
				title: "",
			},
		];
	}

	return normalized;
};

export const getRecurrenceEditorData = (
	instances: RecurrenceInstance[]
) => {
	const sortedInstances = sortRecurrenceInstances(instances);

	const sourceTotals: Record<number, number> = {};

	sortedInstances.forEach((instance) => {
		if (!instance.isSuppressed) {
			const sourceIndex = instance._sourceIdx || 0;
			sourceTotals[sourceIndex] =
				(sourceTotals[sourceIndex] || 0) + 1;
		}
	});

	return {
		sortedInstances,
		sourceTotals,
	};
};