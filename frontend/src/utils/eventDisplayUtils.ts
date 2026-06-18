import type { DateString, TimeString } from "../../../shared/types";
import { formatDateCZfromISO, getDayName } from "./dateUtils";

type EventDisplayItem = {
    start?: DateString;
    end?: DateString;
    startTime?: TimeString;
    endTime?: TimeString;
    completed: boolean;
};

type EventDisplayInfo = {
    timeLabel: string;
    isToday: boolean;
    isOverdue: boolean;
};

const formatEventDateTime = (
    date: DateString | undefined,
    time: TimeString | undefined
): string | null => {
    if (!date) return null;

    const datePart = `${getDayName(date)} ${formatDateCZfromISO(date)}`;

    return time ? `${datePart} ${time}` : datePart;
};

export const getEventDisplayInfo = (
    item: EventDisplayItem,
    today: DateString
): EventDisplayInfo => {
    const startLabel = formatEventDateTime(item.start, item.startTime);
    const endLabel = formatEventDateTime(item.end, item.endTime);

    let timeLabel = "";

    if (startLabel) {
        timeLabel = startLabel;

        if (endLabel && endLabel !== startLabel) {
            timeLabel += ` - ${endLabel}`;
        }
    }

    const start = item.start;
    const end = item.end || item.start;

    const isToday = Boolean(start && start <= today && end && end >= today);
    const isOverdue = Boolean(!item.completed && end && end < today);

    return {
        timeLabel,
        isToday,
        isOverdue,
    };
};