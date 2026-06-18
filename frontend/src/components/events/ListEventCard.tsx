import { useState } from "react";
import { EventHoverZone, ListEventCardProps } from "./eventCardTypes";
import { getEventDisplayInfo } from "../../utils/eventDisplayUtils";
import { getEventCardClassName } from "../../utils/eventCardUtils";
import { getSortedChildren } from "../../utils/itemChildrenUtils";
import { EventHoverOverlay } from "./EventHoverOverlay";
import { EventHeader } from "./EventHeader";
import { AttachedNoteCard } from "../notes/AttachedNoteCard";
import { EventStatusBadge } from "./EventStatusBadge";
import { isCustomSortingEnabled } from "../../utils/sortUtils";

export const ListEventCard = ({
    item,
    draggingId,
    handlers,
    actions,
    isSortEnabled,
    getDayName,
    getTodayStr,
    sharedNotes,
    level = 0,
    onNoteClick,
    onActivityClick,
    sortSettings
}: ListEventCardProps) => {
    const [hoverZone, setHoverZone] = useState<EventHoverZone>(null);
    const isBeingDragged = draggingId === item.id;
    const isChildOfDrag = draggingId && JSON.stringify(item).includes(`"id":${draggingId}`);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (handlers.draggingNote) {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const h = rect.height;

            if (y < h / 3) {
                if (hoverZone !== 'note_move') setHoverZone('note_move');
            } else if (y < (h * 2) / 3) {
                if (hoverZone !== 'note_link') setHoverZone('note_link');
            } else {
                if (hoverZone !== 'note_copy') setHoverZone('note_copy');
            }
            return;
        }

        if (!draggingId || isBeingDragged || isChildOfDrag) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;

        const limitLeft = width * 0.20;
        const limitRight = width * 0.80;
        const halfHeight = height * 0.50;

        if (x < limitLeft) {
            if (hoverZone !== 'makeParent') setHoverZone('makeParent');
        } else if (x > limitRight) {
            if (hoverZone !== 'indent') setHoverZone('indent');
        } else {
            if (isSortEnabled) {
                if (y < halfHeight) {
                    if (hoverZone !== 'insertBefore') setHoverZone('insertBefore');
                } else {
                    if (hoverZone !== 'insertAfter') setHoverZone('insertAfter');
                }
            } else {
                if (hoverZone === 'insertBefore' || hoverZone === 'insertAfter') {
                    setHoverZone(null);
                }
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setHoverZone(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (handlers.draggingNote) {
            let mode = 'link' as 'link' | 'move' | 'copy';
            if (hoverZone === 'note_move') mode = 'move';
            else if (hoverZone === 'note_copy') mode = 'copy';

            handlers.onDropNoteOnTask(handlers.draggingNote.id, handlers.draggingNote.parentId, item.id, mode);
            setHoverZone(null);
            handlers.onDragEnd(e);
            return;
        }

        if (!isSortEnabled && (hoverZone === 'insertBefore' || hoverZone === 'insertAfter')) {
            setHoverZone(null);
            handlers.onDragEnd(e);
            return;
        }

        if (hoverZone === 'indent') handlers.onMoveAsChild(draggingId ?? "", item.id);
        else if (hoverZone === 'makeParent') handlers.onMoveAsParent(draggingId ?? "", item.id);
        else if (hoverZone === 'insertBefore') handlers.onMoveBefore(draggingId ?? "", item.id);
        else if (hoverZone === 'insertAfter') handlers.onMoveAfter(draggingId ?? "", item.id);

        setHoverZone(null);
        handlers.onDragEnd(e);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (isSortEnabled) {
            e.stopPropagation();
            handlers.onDragStart(e, item.id, 0);
        }
    }

    const {
        timeLabel,
        isToday,
        isOverdue,
    } = getEventDisplayInfo(item, getTodayStr());

    const rowBgClass = getEventCardClassName(
        hoverZone,
        isBeingDragged
    );

    const sortedChildren = getSortedChildren(
        item,
        sharedNotes,
        sortSettings
    );

    const hasChildren = sortedChildren.length > 0;

    return (
        <div
            key={item.id}
            className={`flex w-full mb-1 relative`}
            draggable={isSortEnabled}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handlers.onDragEnd}
        >
            {hoverZone === 'insertBefore' && <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 z-50 rounded-full"></div>}
            {hoverZone === 'insertAfter' && <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-500 z-50 rounded-full"></div>}

            <div className={`flex-1 flex flex-col border rounded-lg transition-all relative ${rowBgClass} cursor-pointer hover:shadow-md`}
                onClick={(e) => {
                    e.stopPropagation();
                    const idToOpen = item.isInstance ? item.parentId : item.id;
                    if (!isBeingDragged && onActivityClick) {
                        onActivityClick(idToOpen);
                    }
                }}
            >
                <EventHoverOverlay hoverZone={hoverZone} />

                <EventHeader
                    item={item}
                    timeLabel={timeLabel}
                    isBeingDragged={isBeingDragged}
                    isSortEnabled={isSortEnabled}
                    actions={actions}
                />

                {hasChildren && (
                    <div className="px-2 pb-2">
                        <div className={`pt-2`}>

                            <div className="flex flex-col gap-1 ml-2 pl-2">
                                {sortedChildren.map(child => {
                                    if (child.kind === 'note') {
                                        return (
                                            <AttachedNoteCard
                                                key={child?.note.id}
                                                note={child?.note}
                                                parentId={item.id}
                                                handlers={handlers}
                                                isSortEnabled={isCustomSortingEnabled('note', sortSettings)}
                                                onNoteClick={onNoteClick}
                                                onUnlink={actions.unlinkNote}
                                                onDelete={actions.deleteNote}
                                            />
                                        );
                                    } else {
                                        return (
                                            <ListEventCard
                                                key={child?.item.id}
                                                item={child?.item}
                                                draggingId={draggingId}
                                                handlers={handlers}
                                                actions={actions}
                                                isSortEnabled={isCustomSortingEnabled(child.item.type, sortSettings)}
                                                getDayName={getDayName}
                                                getTodayStr={getTodayStr}
                                                sharedNotes={sharedNotes}
                                                level={level + 1}
                                                onNoteClick={onNoteClick}
                                                onActivityClick={onActivityClick}
                                                sortSettings={sortSettings}
                                            />
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <EventStatusBadge
                isToday={Boolean(isToday)}
                isOverdue={Boolean(isOverdue)}
            />
        </div>
    );
};