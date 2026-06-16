export const DAY_NAMES = [
    "Neděle",
    "Pondělí",
    "Úterý",
    "Středa",
    "Čtvrtek",
    "Pátek",
    "Sobota",
] as const;

export const DAY_NAMES_SHORT = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"] as const;

export const CZECH_MONTHS_NOMINATIVE = [
    "leden",
    "únor",
    "březen",
    "duben",
    "květen",
    "červen",
    "červenec",
    "srpen",
    "září",
    "říjen",
    "listopad",
    "prosinec",
] as const;

const CZECH_MONTHS_GENITIVE = [
    "ledna",
    "února",
    "března",
    "dubna",
    "května",
    "června",
    "července",
    "srpna",
    "září",
    "října",
    "listopadu",
    "prosince",
] as const;

export type CzechDateFormat = "numeric" | "text";
export type CzechMonthCase = "nominative" | "genitive";
export type CzechDayNameFormat = "short" | "long";

// --- ISO date formatting ---

/**
 * Helper function to format a Date object as a string in "YYYY-MM-DD" format.
 * @param date Date object to format.
 * @returns Formatted date string in "YYYY-MM-DD" format.
 */
export const getDateStr = (date: Date): string =>
    [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");

// --- Get today's date string in "YYYY-MM-DD" format ---

/**
 * Helper function to get today's date as a string in "YYYY-MM-DD" format.
 * @returns Today's date string in "YYYY-MM-DD" format.
 * Lifehack: you can compare dates as strings in this format to determine their order.
 * Example: "2024-01-01" < "2024-02-01" is true.
 */
export const getTodayStr = (): string => {
    return getDateStr(new Date());
};

// --- ISO week number calculation ---

/**
 * Helper function to get the ISO week number for a given date.
 * @param date Date object to calculate the week number for.
 * @returns ISO week number (1-53).
 */
export const getISOWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;

    d.setUTCDate(d.getUTCDate() + 4 - dayNum);

    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// --- Czech date formatting ---

/**
* Helper function to format a Date object as a Czech date string.
* @param date Date object to format.
* @param format Format of the output string: "numeric" for "DD. MM. YYYY", "text" for "D. month YYYY".
* @returns Formatted date string in Czech format.
*/
export const formatDateCZ = (
    date: Date,
    format: CzechDateFormat = "numeric"
): string => {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    if (format === "text") {
        return `${day}. ${CZECH_MONTHS_GENITIVE[month]} ${year}`;
    }

    return `${day}. ${month + 1}. ${year}`;
};

// --- Day name retrieval ---

/**
 * Helper function to get the Czech day name for a given date string in "YYYY-MM-DD" format.
 * @param dateStr Date string in "YYYY-MM-DD" format.
 * @returns Czech day name (e.g., "Pondělí" or "Po") or an empty string if the input is invalid.
 */
export const getDayName = (dateStr: string, format: CzechDayNameFormat = "short"): string => {
    if (!dateStr) return "";

    const parts = dateStr.split("-");
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    if (Number.isNaN(date.getTime())) return "";

    return format === "long" ? DAY_NAMES[date.getDay()] : DAY_NAMES_SHORT[date.getDay()];
};

// --- Month name retrieval ---

/**
 * Helper function to get the Czech month name for a given month index (0-11).
 * @param monthIndex Month index (0 for January, 11 for December).
 * @param grammaticalCase Grammatical case for the month name: "nominative" or "genitive".
 * @returns Czech month name in the specified grammatical case.
 */
export const getMonthName = (
    monthIndex: number,
    grammaticalCase: CzechMonthCase = "nominative"
): string => {
    return grammaticalCase === "genitive"
        ? CZECH_MONTHS_GENITIVE[monthIndex]
        : CZECH_MONTHS_NOMINATIVE[monthIndex];
};

// --- Date offset ---

/**
 * Helper function to get a date string in "YYYY-MM-DD" format for a date relative to today.
 * @param offset Number of days to offset from today (e.g., -1 for yesterday, 0 for today, 1 for tomorrow).
 * @returns Date string in "YYYY-MM-DD" format.
 */
export const getRelativeDateStr = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return getDateStr(d);
};