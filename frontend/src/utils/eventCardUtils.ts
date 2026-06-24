import { EventHoverZone } from "../components/events/event-card/eventCardTypes";

export const getEventCardClassName = (
    hoverZone: EventHoverZone,
    isBeingDragged: boolean
): string => {
    if (isBeingDragged) {
        return "bg-blue-900 border-blue-900 opacity-50 text-white";
    }

    if (hoverZone === "indent") {
        return "bg-green-100 ring-2 ring-green-500 border-green-300";
    }

    if (hoverZone === "makeParent") {
        return "bg-purple-100 ring-2 ring-purple-500 border-purple-300";
    }

    if (hoverZone === "note_move") {
        return "bg-sky-100 ring-2 ring-sky-500 border-sky-300";
    }

    if (hoverZone === "note_link") {
        return "bg-yellow-100 ring-2 ring-yellow-500 border-yellow-300";
    }

    if (hoverZone === "note_copy") {
        return "bg-orange-100 ring-2 ring-orange-500 border-orange-300";
    }

    return "bg-blue-50 border-blue-200 shadow-sm";
};