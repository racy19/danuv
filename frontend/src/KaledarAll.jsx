import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Clock, ChevronRight, ChevronDown, ChevronUp, Check, Calendar as CalendarIcon, List, CheckSquare, Square, Undo, X, Save, StickyNote, Database, ListTodo, Equal, MoreVertical, Copy, GripVertical, CornerDownRight, CornerLeftUp, FileText, Info, Code, LayoutTemplate, HelpCircle, Calculator, ListChecks, Settings, ArrowUp, ArrowDown, ArrowUpDown, AlertTriangle, ArrowRight, MoveLeft, MousePointerClick, ArrowUpCircle, ListTree, Download, Upload, FileDown, FileUp, ShieldAlert, User, Link as LinkIcon, Edit3, ExternalLink, Folder, Search, Eye, EyeOff, Type, Pin, MoreHorizontal, Unlink, ArrowRightCircle, Copy as CopyIcon, CalendarPlus, Repeat, CalendarRange, RotateCw, ListOrdered, RefreshCw, Ban } from 'lucide-react';

// --- DATA A KONFIGURACE ---
const DAY_NAMES = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
const DAY_NAMES_SHORT = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];

// NOVÉ MOŽNOSTI ŘAZENÍ (GRANULÁRNÍ)
const GROUP_ORDER_OPTIONS = [
    { value: 'act_note', label: 'Aktivity ➜ Poznámky' },
    { value: 'note_act', label: 'Poznámky ➜ Aktivity' },
    { value: 'none', label: 'Žádné (Promíchat)' }
];

const INTERNAL_SORT_OPTIONS = [
    { value: 'custom', label: 'Vlastní (Drag & Drop)' },
    { value: 'az', label: 'Abecedně A-Z' },
    { value: 'za', label: 'Abecedně Z-A' },
    { value: 'dateAsc', label: 'Od nejstaršího' },
    { value: 'dateDesc', label: 'Od nejnovějšího' },
];

// --- HELPERY (GLOBAL SCOPE) ---

const getISOWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const getListSortFn = (method) => {
    return (a, b) => {
        const sortByAlpha = (i1, i2) => (i1.title || "").localeCompare(i2.title || "");
        const sortByDateAsc = (i1, i2) => {
            const d1 = i1.start || "9999-99-99";
            const d2 = i2.start || "9999-99-99";
            if (d1 !== d2) return d1.localeCompare(d2);
            return (i1.startTime || "00:00").localeCompare(i2.startTime || "00:00");
        };
        const sortByDateDesc = (i1, i2) => {
            const d1 = i1.start || "0000-00-00";
            const d2 = i2.start || "0000-00-00";
            if (d1 !== d2) return d2.localeCompare(d1);
            return (i2.startTime || "00:00").localeCompare(i1.startTime || "00:00");
        };

        if (method === 'az') return sortByAlpha(a, b);
        if (method === 'za') return (b.title || "").localeCompare(a.title || "");
        if (method === 'dateAsc') return sortByDateAsc(a, b);
        if (method === 'dateDesc') return sortByDateDesc(a, b);

        return sortByAlpha(a, b);
    };
};

const sortAndGroupItems = (items, settings) => {
    const sortFn = getListSortFn;

    if (!settings) return items; // Fallback

    if (settings.group === 'none') {
        const sorted = [...items];
        if (settings.actSort !== 'custom') {
            sorted.sort(sortFn(settings.actSort));
        }
        return sorted;
    }

    const notes = items.filter(i => i.type === 'note');
    const acts = items.filter(i => i.type !== 'note');

    if (settings.noteSort !== 'custom') {
        notes.sort(sortFn(settings.noteSort));
    }
    if (settings.actSort !== 'custom') {
        acts.sort(sortFn(settings.actSort));
    }

    if (settings.group === 'act_note') {
        return [...acts, ...notes];
    } else {
        return [...notes, ...acts];
    }
};

const renderTypeIcon = (type, className) => {
    switch (type) {
        case 'note': return <StickyNote className={className} />;
        case 'task': return <ListTodo className={className} />;
        case 'project': return <Folder className={className} />;
        default: return <CalendarIcon className={className} />;
    }
};

const generateRecurrenceInstances = (startStr, endStr, pattern, interval, unit, daysOfWeek, baseStartTime, baseEndTime, weekParity = ['odd', 'even'], multiDefs = [], parentTitle = "") => {
    if (!startStr || !endStr) return [];

    const start = new Date(startStr);
    const end = new Date(endStr);
    const instances = [];

    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);

    let current = new Date(start);
    const originalStartDay = start.getDate();
    const originalStartMonth = start.getMonth();

    let safetyCounter = 0;

    while (current <= end && safetyCounter < 1000) {
        safetyCounter++;
        let match = false;

        if (pattern === 'daily') {
            match = true;
        } else if (pattern === 'weekly') {
            let dayMatch = true;
            if (daysOfWeek && daysOfWeek.length > 0) {
                const dayIdx = current.getDay();
                if (!daysOfWeek.includes(dayIdx)) dayMatch = false;
            }

            let weekMatch = true;
            if (weekParity && weekParity.length > 0) {
                if (weekParity.length < 2) {
                    const weekNum = getISOWeek(current);
                    const isOdd = weekNum % 2 !== 0;
                    const requiredType = isOdd ? 'odd' : 'even';
                    if (!weekParity.includes(requiredType)) weekMatch = false;
                }
            } else {
                weekMatch = false;
            }

            match = dayMatch && weekMatch;
        } else if (pattern === 'monthly') {
            match = true;
        } else if (pattern === 'yearly') {
            match = true;
        } else if (pattern === 'custom') {
            const dayIdx = current.getDay();
            if (unit === 'week') {
                if (daysOfWeek && daysOfWeek.length > 0) {
                    if (daysOfWeek.includes(dayIdx)) match = true;
                } else {
                    match = true;
                }
            } else {
                match = true;
            }
        }

        if (match) {
            const dateStr = current.toISOString().split('T')[0];

            // Logika pro multi_recurring vs single recurring
            const defsToUse = (multiDefs && multiDefs.length > 0)
                ? multiDefs
                : [{ startTime: baseStartTime, endTime: baseEndTime, title: null }];

            defsToUse.forEach((def, defIdx) => {
                // NOVÉ PRAVIDLO: Pokud jsme v režimu rozvrhu a chybí název, tuto položku pro daný den vynecháme
                if (multiDefs && multiDefs.length > 0 && (!def.title || def.title.trim() === '')) {
                    return;
                }

                instances.push({
                    id: `${dateStr}-${defIdx}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date: dateStr,
                    originalDate: dateStr,
                    endDate: dateStr,
                    startTime: def.startTime,
                    endTime: def.endTime,
                    completed: false,
                    isGenerated: true,
                    isSuppressed: false,
                    isEdited: false,
                    customTitle: def.title || null, // U multi defs je název povinný/vlastní, u single se bere od rodiče
                    subtasks: [],
                    linkedNoteIds: [],
                    isHidden: false,
                    _sourceIdx: defIdx // Pomocný index pro párování
                });
            });
        }

        if (pattern === 'daily') {
            current.setDate(current.getDate() + 1);
        } else if (pattern === 'weekly') {
            current.setDate(current.getDate() + 1);
        } else if (pattern === 'monthly') {
            current.setDate(1);
            current.setMonth(current.getMonth() + 1);
            const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
            current.setDate(Math.min(originalStartDay, daysInMonth));
        } else if (pattern === 'yearly') {
            const nextYear = current.getFullYear() + 1;
            current.setFullYear(nextYear);
            current.setMonth(originalStartMonth, 1);
            const daysInMonth = new Date(nextYear, originalStartMonth + 1, 0).getDate();
            current.setDate(Math.min(originalStartDay, daysInMonth));
        } else if (pattern === 'custom') {
            if (unit === 'day') current.setDate(current.getDate() + interval);
            else if (unit === 'week') {
                current.setDate(current.getDate() + 1);
            }
            else if (unit === 'month') {
                current.setDate(1);
                current.setMonth(current.getMonth() + interval);
                const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
                current.setDate(Math.min(originalStartDay, daysInMonth));
            }
            else if (unit === 'year') {
                const nextYear = current.getFullYear() + interval;
                current.setFullYear(nextYear);
                current.setMonth(originalStartMonth, 1);
                const daysInMonth = new Date(nextYear, originalStartMonth + 1, 0).getDate();
                current.setDate(Math.min(originalStartDay, daysInMonth));
            }
        }
    }
    return instances;
};

const areSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));

const CustomSortSelect = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-700 py-2.5 px-3 rounded flex items-center justify-between hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors text-sm shadow-sm"
            >
                <span className="truncate">{selectedOption.label}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-[350px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {options.map(opt => {
                        const isSelected = value === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`w-full px-3 py-2 text-sm text-left flex items-center transition-colors border-b border-slate-50 last:border-0 ${isSelected ? 'bg-teal-50 text-teal-800 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span className="truncate w-full">{opt.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 ml-2 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const RecursiveItem = () => { return null; };

const AttachedNoteCard = ({ note, parentId, handlers, isSortEnabled, onNoteClick, onUnlink, onDelete }) => {
    const [hoverZone, setHoverZone] = useState(null);
    const isBeingDragged = handlers.draggingNote?.id === note.id && handlers.draggingNote?.parentId === parentId;

    const handleDragStart = (e) => {
        if (!isSortEnabled) return;
        handlers.onDragStartNote(e, note.id, parentId);
    };

    const handleDragOver = (e) => {
        if (!isSortEnabled || !handlers.draggingNote) return;
        e.preventDefault();
        e.stopPropagation();

        if (isBeingDragged) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        if (y < rect.height / 2) {
            if (hoverZone !== 'before') setHoverZone('before');
        } else {
            if (hoverZone !== 'after') setHoverZone('after');
        }
    };

    const handleDrop = (e) => {
        if (!isSortEnabled || !handlers.draggingNote) return;
        e.preventDefault();
        e.stopPropagation();

        if (!isBeingDragged) {
            handlers.onDropNoteOnNote(handlers.draggingNote.id, handlers.draggingNote.parentId, parentId, note.id, hoverZone);
        }
        setHoverZone(null);
        handlers.onDragEnd(e);
    };

    const hasContent = note.type !== 'heading' && note.content && note.content.trim() !== '';

    return (
        <div
            className={`flex w-full relative group ${isBeingDragged ? 'opacity-50' : ''}`}
            draggable={isSortEnabled}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={(e) => { e.stopPropagation(); setHoverZone(null); }}
            onDrop={handleDrop}
            onDragEnd={handlers.onDragEnd}
        >
            {hoverZone === 'before' && <div className="absolute -top-1 left-0 right-0 h-1 bg-yellow-500 z-50 rounded-full"></div>}
            {hoverZone === 'after' && <div className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-500 z-50 rounded-full"></div>}

            <div
                onClick={(e) => { e.stopPropagation(); onNoteClick(note.id); }}
                className={`flex-1 flex flex-col border rounded-lg transition-all relative shadow-sm mb-1 cursor-pointer hover:shadow-md ${hoverZone ? 'border-yellow-400 bg-yellow-100' : 'border-yellow-200 bg-yellow-50'}`}
            >
                <div className="flex items-start px-2 py-1.5 gap-3 min-h-[36px]">
                    {isSortEnabled && (
                        <div className="cursor-grab active:cursor-grabbing text-yellow-500 hover:text-yellow-700 -ml-1 shrink-0 flex items-center justify-center mt-0.5">
                            <GripVertical className="w-4 h-4" />
                        </div>
                    )}
                    {!isSortEnabled && <div className="w-4 h-4 -ml-1 shrink-0"></div>}

                    <div className="flex-1 flex flex-col min-w-0 pt-0.5">
                        <span className="font-bold text-xs break-words leading-tight text-yellow-900">
                            {note.title}
                        </span>
                        {hasContent && (
                            <div className="text-xs text-yellow-800 mt-1 whitespace-pre-wrap leading-relaxed pb-1">
                                {note.content}
                            </div>
                        )}
                    </div>

                    <div className="absolute right-2 top-0.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-50 backdrop-blur-sm p-0.5 rounded border border-yellow-200 shadow-sm z-20">
                        <button
                            onClick={(e) => { e.stopPropagation(); onUnlink(parentId, note.id); }}
                            className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                            title="Odpojit"
                        >
                            <Unlink className="w-3.5 h-3.5" />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Smazat"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ListEventCard = ({
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
}) => {
    const [hoverZone, setHoverZone] = useState(null);
    const isBeingDragged = draggingId === item.id;
    const isChildOfDrag = draggingId && JSON.stringify(item).includes(`"id":${draggingId}`);

    const handleDragOver = (e) => {
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

    const handleDragLeave = (e) => {
        e.stopPropagation();
        setHoverZone(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (handlers.draggingNote) {
            let mode = 'link';
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

        if (hoverZone === 'indent') handlers.onMoveAsChild(draggingId, item.id);
        else if (hoverZone === 'makeParent') handlers.onMoveAsParent(draggingId, item.id);
        else if (hoverZone === 'insertBefore') handlers.onMoveBefore(draggingId, item.id);
        else if (hoverZone === 'insertAfter') handlers.onMoveAfter(draggingId, item.id);

        setHoverZone(null);
        handlers.onDragEnd(e);
    };

    const handleDragStart = (e) => {
        if (isSortEnabled) {
            e.stopPropagation();
            handlers.onDragStart(e, item.id, 0);
        }
    }

    const formatDateTime = (d, t) => {
        if (!d) return null;
        const [y, m, day] = d.split('-');
        const datePart = `${getDayName(d)} ${day}.${m}.${y}`;
        return t ? `${datePart} ${t}` : datePart;
    };

    const startStr = formatDateTime(item.start, item.startTime);
    const endStr = formatDateTime(item.end, item.endTime);

    let timeLabel = "";
    if (startStr) {
        timeLabel = startStr;
        if (endStr && endStr !== startStr) {
            timeLabel += ` - ${endStr}`;
        }
    }

    const todayStr = getTodayStr();
    const s = item.start;
    const e = item.end || item.start;
    const isToday = s && s <= todayStr && e >= todayStr;
    const isOverdue = !item.completed && e && e < todayStr;

    let rowBgClass = 'bg-blue-50 border-blue-200 shadow-sm';
    if (isBeingDragged) rowBgClass = 'bg-blue-900 border-blue-900 opacity-50 text-white';
    else if (hoverZone === 'indent') rowBgClass = 'bg-green-100 ring-2 ring-green-500 border-green-300';
    else if (hoverZone === 'makeParent') rowBgClass = 'bg-purple-100 ring-2 ring-purple-500 border-purple-300';

    else if (hoverZone === 'note_move') rowBgClass = 'bg-sky-100 ring-2 ring-sky-500 border-sky-300';
    else if (hoverZone === 'note_link') rowBgClass = 'bg-yellow-100 ring-2 ring-yellow-500 border-yellow-300';
    else if (hoverZone === 'note_copy') rowBgClass = 'bg-orange-100 ring-2 ring-orange-500 border-orange-300';

    const resolvedNotes = (item.linkedNoteIds || []).map(id => {
        const note = sharedNotes[id];
        return note ? { ...note, type: 'note' } : null;
    }).filter(Boolean);

    const subtasks = item.subtasks || [];
    const allChildren = [...resolvedNotes, ...subtasks];
    const sortedChildren = sortAndGroupItems(allChildren, sortSettings);

    const checkSubSortEnabled = (itemType) => {
        if (!sortSettings) return true;
        if (sortSettings.group === 'none') return sortSettings.actSort === 'custom';
        if (itemType === 'note') return sortSettings.noteSort === 'custom';
        return sortSettings.actSort === 'custom';
    };

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
                {hoverZone === 'note_move' && (
                    <div className="absolute left-1/2 top-2 -translate-x-1/2 flex items-center gap-2 pointer-events-none text-sky-800 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/95 px-3 py-1 rounded shadow-md border border-sky-200 text-xs font-bold uppercase">
                        <ArrowRightCircle className="w-4 h-4" /> <span>Přesunout k aktivitě</span>
                    </div>
                )}
                {hoverZone === 'note_link' && (
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none text-yellow-800 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/95 px-3 py-1 rounded shadow-md border border-yellow-200 text-xs font-bold uppercase">
                        <LinkIcon className="w-4 h-4" /> <span>Připojit k aktivitě</span>
                    </div>
                )}
                {hoverZone === 'note_copy' && (
                    <div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex items-center gap-2 pointer-events-none text-orange-800 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/95 px-3 py-1 rounded shadow-md border border-orange-200 text-xs font-bold uppercase">
                        <CopyIcon className="w-4 h-4" /> <span>Vytvořit kopii a připojit</span>
                    </div>
                )}
                {hoverZone === 'makeParent' && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-purple-700 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/90 px-2 py-1 rounded shadow-sm border border-purple-200 text-[10px] font-bold uppercase">
                        <CornerLeftUp className="w-3 h-3" />
                        <span>Nadřadit</span>
                    </div>
                )}
                {hoverZone === 'indent' && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-green-700 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/90 px-2 py-1 rounded shadow-sm border border-green-200 text-[10px] font-bold uppercase">
                        <span>Vnořit</span>
                        <CornerDownRight className="w-3 h-3" />
                    </div>
                )}

                <div className="flex items-center px-2 py-1 gap-3 min-h-[36px] group">
                    {isSortEnabled && (
                        <div
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 -ml-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="w-4 h-4" />
                        </div>
                    )}

                    <button
                        onClick={(e) => actions.toggleStatus(e, item.id)}
                        className="w-[22px] h-[22px] bg-white border border-blue-200 rounded flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
                    >
                        {item.completed ?
                            <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} /> :
                            <X className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />
                        }
                    </button>

                    <div className="flex-1 flex flex-row items-center gap-x-2 min-w-0">
                        {item.isInstance && (
                            <Repeat className="w-3 h-3 text-blue-400 shrink-0" />
                        )}
                        {timeLabel && (
                            <div className="w-[300px] shrink-0">
                                <span className={`text-xs font-mono whitespace-nowrap ${isBeingDragged ? 'text-white/80' : 'text-slate-500'}`}>
                                    {timeLabel}
                                </span>
                            </div>
                        )}
                        <span className={`font-bold text-xs break-words leading-tight ${isBeingDragged ? 'text-white' : 'text-black'}`}>
                            {item.title}
                        </span>
                    </div>

                    <div className="absolute right-2 top-0.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 backdrop-blur-sm p-0.5 rounded border border-blue-200 shadow-sm z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => actions.createActivityForActivity(e, item.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Připojit novou aktivitu (podúkol)"
                        >
                            <CalendarPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => actions.createNoteForActivity(e, item.id)}
                            className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                            title="Připojit novou poznámku"
                        >
                            <StickyNote className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => actions.toggleHide(e, item.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title={item.isHidden ? "Zobrazit" : "Skrýt"}
                        >
                            {item.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={(e) => actions.deleteEvent(e, item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={item.isGenerated ? "Potlačit výskyt" : "Smazat"}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {hasChildren && (
                    <div className="px-2 pb-2">
                        <div className={`pt-2`}>

                            <div className="flex flex-col gap-1 ml-2 pl-2">
                                {sortedChildren.map(child => {
                                    if (child.type === 'note') {
                                        return (
                                            <AttachedNoteCard
                                                key={child.id}
                                                note={child}
                                                parentId={item.id}
                                                handlers={handlers}
                                                isSortEnabled={checkSubSortEnabled('note')}
                                                onNoteClick={onNoteClick}
                                                onUnlink={actions.unlinkNote}
                                                onDelete={actions.deleteNote}
                                            />
                                        );
                                    } else {
                                        return (
                                            <ListEventCard
                                                key={child.id}
                                                item={child}
                                                draggingId={draggingId}
                                                handlers={handlers}
                                                actions={actions}
                                                isSortEnabled={checkSubSortEnabled(child.type)}
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

            {(isOverdue || (isToday && !isOverdue)) && (
                <div className="ml-2 flex flex-col justify-start pt-1.5 shrink-0 gap-1">
                    {isOverdue && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-red-600 text-white border border-red-800 shadow-md whitespace-nowrap">
                            Po termínu
                        </span>
                    )}
                    {isToday && !isOverdue && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-blue-600 text-white border border-blue-800 shadow-md whitespace-nowrap">
                            Dnes
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default function KalendarApp() {
    const [activeView, setActiveView] = useState('list');
    const [startDate] = useState(new Date());

    const [undoData, setUndoData] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [draggingId, setDraggingId] = useState(null);
    const [justDroppedId, setJustDroppedId] = useState(null);
    const [draggingNote, setDraggingNote] = useState(null);
    const [originalEvents, setOriginalEvents] = useState({});
    const [safeGuardIds, setSafeGuardIds] = useState([]);
    const [deleteConfirmationLevel, setDeleteConfirmationLevel] = useState(0);
    const [warningMsg, setWarningMsg] = useState(null);
    const [expandedIds, setExpandedIds] = useState([]);
    const [openTypeDropdownId, setOpenTypeDropdownId] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [showSortSettings, setShowSortSettings] = useState(false);
    const [viewSearchQuery, setViewSearchQuery] = useState("");
    const [sectionState, setSectionState] = useState({
        hidden: true,
        noDate: false,
        withDate: false,
        notesHidden: true,
        projectsHidden: true,
    });

    const activeInstanceTextareaRef = useRef(null);

    const toggleSection = (section) => {
        setSectionState(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const [showStats, setShowStats] = useState(() => {
        try {
            const saved = localStorage.getItem('calendarAppV8_ShowStats');
            return saved !== null ? JSON.parse(saved) : true;
        } catch (e) {
            return true;
        }
    });

    useEffect(() => {
        localStorage.setItem('calendarAppV8_ShowStats', JSON.stringify(showStats));
    }, [showStats]);

    const [listSortSettings, setListSortSettings] = useState(() => {
        try {
            const savedStr = localStorage.getItem('calendarAppV8_ListSort');
            if (savedStr) {
                const saved = JSON.parse(savedStr);
                if (typeof saved.noDate === 'string') {
                    return {
                        noDate: { group: 'act_note', actSort: 'custom', noteSort: 'custom' },
                        withDate: { group: 'act_note', actSort: 'dateAsc', noteSort: 'custom' },
                        hidden: { group: 'act_note', actSort: 'dateAsc', noteSort: 'custom' }
                    };
                }
                return saved;
            }
        } catch (e) { console.error(e); }

        return {
            noDate: { group: 'act_note', actSort: 'custom', noteSort: 'custom' },
            withDate: { group: 'act_note', actSort: 'dateAsc', noteSort: 'custom' },
            hidden: { group: 'act_note', actSort: 'dateAsc', noteSort: 'custom' }
        };
    });

    useEffect(() => {
        localStorage.setItem('calendarAppV8_ListSort', JSON.stringify(listSortSettings));
    }, [listSortSettings]);

    const [sharedNotes, setSharedNotes] = useState({});
    const [isNotePickerOpen, setIsNotePickerOpen] = useState(false);
    const [targetItemIdForNote, setTargetItemIdForNote] = useState(null);
    const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [activeNoteContent, setActiveNoteContent] = useState("");
    const [activeNoteTitle, setActiveNoteTitle] = useState("");
    const [activeNoteType, setActiveNoteType] = useState("text");
    const [tempNoteLinks, setTempNoteLinks] = useState(new Set());
    const [originalNoteLinks, setOriginalNoteLinks] = useState(new Set());

    const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [activeProjectTitle, setActiveProjectTitle] = useState("");
    const [activeProjectCompleted, setActiveProjectCompleted] = useState(false);
    const [tempProjectLinks, setTempProjectLinks] = useState(new Set());

    const [isActivityEditorOpen, setIsActivityEditorOpen] = useState(false);
    const [activeActivityId, setActiveActivityId] = useState(null);
    const [activeActivityTitle, setActiveActivityTitle] = useState("");
    const [activeActivityStart, setActiveActivityStart] = useState("");
    const [activeActivityEnd, setActiveActivityEnd] = useState("");
    const [activeActivityStartTime, setActiveActivityStartTime] = useState("");
    const [activeActivityEndTime, setActiveActivityEndTime] = useState("");
    const [activeActivityCompleted, setActiveActivityCompleted] = useState(false);
    const [activeActivityType, setActiveActivityType] = useState("single");
    const [activeActivityIntervalStart, setActiveActivityIntervalStart] = useState("");
    const [activeActivityIntervalEnd, setActiveActivityIntervalEnd] = useState("");

    const [activeActivityRecurrencePattern, setActiveActivityRecurrencePattern] = useState("daily");
    const [activeActivityRecurrenceInterval, setActiveActivityRecurrenceInterval] = useState(1);
    const [activeActivityRecurrenceUnit, setActiveActivityRecurrenceUnit] = useState("day");
    const [activeActivityRecurrenceDays, setActiveActivityRecurrenceDays] = useState([]);
    const [activeActivityRecurrenceWeeks, setActiveActivityRecurrenceWeeks] = useState(['odd', 'even']);

    const lastRecurrenceSignature = useRef("");
    const [recurrenceNeedsUpdate, setRecurrenceNeedsUpdate] = useState(false);

    const [isRecurrenceInstancesOpen, setIsRecurrenceInstancesOpen] = useState(false);
    const [currentRecurrenceInstances, setCurrentRecurrenceInstances] = useState([]);

    const [editingInstanceId, setEditingInstanceId] = useState(null);
    const [instanceEditData, setInstanceEditData] = useState({ title: "", date: "", endDate: "", startTime: "", endTime: "" });

    // NOVÉ: Stavy pro "Více opakujících se aktivit"
    const [activeActivityMultiDefs, setActiveActivityMultiDefs] = useState([]);

    const [showNameHelp, setShowNameHelp] = useState(false);
    const nameHelpRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (nameHelpRef.current && !nameHelpRef.current.contains(e.target)) {
                setShowNameHelp(false);
            }
        };
        if (showNameHelp) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNameHelp]);

    useEffect(() => {
        if (editingInstanceId && activeInstanceTextareaRef.current) {
            activeInstanceTextareaRef.current.style.height = 'auto';
            activeInstanceTextareaRef.current.style.height = (activeInstanceTextareaRef.current.scrollHeight + 2) + 'px';
        }
    }, [editingInstanceId]);

    const getRecurrenceSignature = () => {
        return JSON.stringify({
            start: activeActivityIntervalStart,
            end: activeActivityIntervalEnd,
            pattern: activeActivityRecurrencePattern,
            interval: activeActivityRecurrenceInterval,
            unit: activeActivityRecurrenceUnit,
            days: [...activeActivityRecurrenceDays].sort(),
            startTime: activeActivityStartTime,
            endTime: activeActivityEndTime,
            weeks: [...activeActivityRecurrenceWeeks].sort(),
            multiDefs: activeActivityMultiDefs // Zahrnuto v podpisu
        });
    };

    useEffect(() => {
        if (isActivityEditorOpen && (activeActivityType === 'recurring' || activeActivityType === 'multi_recurring') && lastRecurrenceSignature.current) {
            try {
                const original = JSON.parse(lastRecurrenceSignature.current);

                // Detekce pouze STRUKTURÁLNÍCH změn (změna počtu dnů, frekvence atd.)
                const isStructurallyDifferent =
                    original.start !== activeActivityIntervalStart ||
                    original.end !== activeActivityIntervalEnd ||
                    original.pattern !== activeActivityRecurrencePattern ||
                    original.interval !== activeActivityRecurrenceInterval ||
                    original.unit !== activeActivityRecurrenceUnit ||
                    JSON.stringify(original.days) !== JSON.stringify([...activeActivityRecurrenceDays].sort()) ||
                    JSON.stringify(original.weeks || ['odd', 'even']) !== JSON.stringify([...activeActivityRecurrenceWeeks].sort()) ||
                    (original.multiDefs || []).length !== activeActivityMultiDefs.length;

                setRecurrenceNeedsUpdate(isStructurallyDifferent);
            } catch (err) {
                setRecurrenceNeedsUpdate(false);
            }
        } else {
            setRecurrenceNeedsUpdate(false);
        }
    }, [
        isActivityEditorOpen,
        activeActivityType,
        activeActivityIntervalStart,
        activeActivityIntervalEnd,
        activeActivityRecurrencePattern,
        activeActivityRecurrenceInterval,
        activeActivityRecurrenceUnit,
        activeActivityRecurrenceDays,
        activeActivityRecurrenceWeeks,
        activeActivityMultiDefs
    ]);

    // AUTO-SYNC časů a názvů pro neupravené instance
    useEffect(() => {
        if (!isActivityEditorOpen || (activeActivityType !== 'recurring' && activeActivityType !== 'multi_recurring')) return;

        setCurrentRecurrenceInstances(prev => {
            let hasChanges = false;
            const next = prev.map(inst => {
                if (inst.isEdited) return inst; // Přeskočíme ručně upravené

                let newStartTime = inst.startTime;
                let newEndTime = inst.endTime;
                let newCustomTitle = inst.customTitle;

                if (activeActivityType === 'multi_recurring') {
                    const def = activeActivityMultiDefs[inst._sourceIdx];
                    if (def) {
                        newStartTime = def.startTime;
                        newEndTime = def.endTime;
                        newCustomTitle = def.title || null;
                    }
                } else if (activeActivityType === 'recurring') {
                    newStartTime = activeActivityStartTime;
                    newEndTime = activeActivityEndTime;
                    // U klasického opakování se název bere dynamicky z hlavního názvu aktivity
                    newCustomTitle = null;
                }

                if (inst.startTime !== newStartTime || inst.endTime !== newEndTime || inst.customTitle !== newCustomTitle) {
                    hasChanges = true;
                    return { ...inst, startTime: newStartTime, endTime: newEndTime, customTitle: newCustomTitle };
                }
                return inst;
            });
            return hasChanges ? next : prev;
        });
    }, [
        activeActivityStartTime,
        activeActivityEndTime,
        activeActivityMultiDefs,
        activeActivityType,
        isActivityEditorOpen
    ]);

    const handleManualRegeneration = () => {
        const freshInstances = generateRecurrenceInstances(
            activeActivityIntervalStart,
            activeActivityIntervalEnd,
            activeActivityRecurrencePattern,
            activeActivityRecurrenceInterval,
            activeActivityRecurrenceUnit,
            activeActivityRecurrenceDays,
            activeActivityStartTime,
            activeActivityEndTime,
            activeActivityRecurrenceWeeks,
            activeActivityType === 'multi_recurring' ? activeActivityMultiDefs : []
        );

        const mergedInstances = freshInstances.map(fresh => {
            // U multi-recurring párujeme podle data a sourceIdx
            const existing = currentRecurrenceInstances.find(curr =>
                (curr.originalDate || curr.date) === fresh.date &&
                (activeActivityType !== 'multi_recurring' || curr._sourceIdx === fresh._sourceIdx)
            );
            if (existing) {
                if (existing.isEdited) {
                    return { ...existing };
                }
                return {
                    ...fresh,
                    id: existing.id,
                    completed: existing.completed,
                    isSuppressed: existing.isSuppressed || false,
                    isEdited: false,
                    subtasks: existing.subtasks || [],
                    linkedNoteIds: existing.linkedNoteIds || [],
                    isHidden: existing.isHidden || false
                };
            }
            return fresh;
        });

        setCurrentRecurrenceInstances(mergedInstances);
        lastRecurrenceSignature.current = getRecurrenceSignature();
        setRecurrenceNeedsUpdate(false);
    };

    const handleRevertRecurrenceChanges = (e) => {
        e.stopPropagation();
        if (!lastRecurrenceSignature.current) return;

        try {
            const original = JSON.parse(lastRecurrenceSignature.current);
            setActiveActivityIntervalStart(original.start);
            setActiveActivityIntervalEnd(original.end);
            setActiveActivityRecurrencePattern(original.pattern);
            setActiveActivityRecurrenceInterval(original.interval);
            setActiveActivityRecurrenceUnit(original.unit);
            setActiveActivityRecurrenceDays(original.days);
            setActiveActivityRecurrenceWeeks(original.weeks || ['odd', 'even']);

            // Obnovíme strukturu (počet položek v rozvrhu), 
            // ale zachováme aktuálně vepsané názvy a časy, které nezpůsobily varování
            if (original.multiDefs) {
                const restoredDefs = original.multiDefs.map((origDef, idx) => {
                    const currentDef = activeActivityMultiDefs[idx];
                    if (currentDef) {
                        return { ...origDef, title: currentDef.title, startTime: currentDef.startTime, endTime: currentDef.endTime };
                    }
                    return origDef;
                });
                setActiveActivityMultiDefs(restoredDefs);
            } else {
                setActiveActivityMultiDefs([]);
            }
        } catch (err) {
            console.error("Failed to revert recurrence settings", err);
        }
    };

    const [tempActivityLinks, setTempActivityLinks] = useState(new Set());

    const [targetParentIdForNewActivity, setTargetParentIdForNewActivity] = useState(null);

    const [tempStatusChanges, setTempStatusChanges] = useState({});

    const [editorZIndices, setEditorZIndices] = useState({ note: 70, project: 70, activity: 70 });

    const bringToFront = (type) => {
        setEditorZIndices(prev => {
            const max = Math.max(prev.note, prev.project, prev.activity, 70);
            return { ...prev, [type]: max + 1 };
        });
    };

    const handleTempStatusToggle = (e, id, originalStatus) => {
        e.stopPropagation();
        setTempStatusChanges(prev => {
            const currentVisual = prev[id] !== undefined ? prev[id] : originalStatus;
            const newValue = !currentVisual;
            const newMap = { ...prev, [id]: newValue };
            if (newValue === originalStatus) delete newMap[id];
            return newMap;
        });
    };

    const handleRecurrencePatternChange = (pattern) => {
        setActiveActivityRecurrencePattern(pattern);
        if (pattern === 'daily') { setActiveActivityRecurrenceUnit('day'); setActiveActivityRecurrenceInterval(1); }
        if (pattern === 'weekly') { setActiveActivityRecurrenceUnit('week'); setActiveActivityRecurrenceInterval(1); }
        if (pattern === 'monthly') { setActiveActivityRecurrenceUnit('month'); setActiveActivityRecurrenceInterval(1); }
        if (pattern === 'yearly') { setActiveActivityRecurrenceUnit('year'); setActiveActivityRecurrenceInterval(1); }
    };

    const toggleRecurrenceDay = (dayIndex) => {
        setActiveActivityRecurrenceDays(prev => {
            if (prev.includes(dayIndex)) return prev.filter(d => d !== dayIndex);
            return [...prev, dayIndex].sort();
        });
    };

    const toggleRecurrenceWeek = (weekType) => {
        setActiveActivityRecurrenceWeeks(prev => {
            if (prev.includes(weekType)) return prev.filter(w => w !== weekType);
            return [...prev, weekType];
        });
    };

    const toggleRecurrenceInstanceComplete = (instanceId) => {
        setCurrentRecurrenceInstances(prev => prev.map(inst =>
            inst.id === instanceId ? { ...inst, completed: !inst.completed } : inst
        ));
    };

    const toggleRecurrenceInstanceSuppression = (instanceId) => {
        setCurrentRecurrenceInstances(prev => prev.map(inst =>
            inst.id === instanceId ? { ...inst, isSuppressed: !inst.isSuppressed } : inst
        ));
    };

    const startEditingInstance = (inst) => {
        setEditingInstanceId(inst.id);
        setInstanceEditData({
            title: inst.customTitle || activeActivityTitle,
            date: inst.date,
            endDate: inst.endDate || inst.date,
            startTime: inst.startTime || "",
            endTime: inst.endTime || ""
        });
    };

    const saveEditingInstance = () => {
        const previousInstances = JSON.parse(JSON.stringify(currentRecurrenceInstances));

        setCurrentRecurrenceInstances(prev => prev.map(inst => {
            if (inst.id === editingInstanceId) {
                const baseDate = inst.originalDate || inst.date;
                const defaultTitle = activeActivityTitle || "";
                const newTitle = (instanceEditData.title || "").trim();

                const titleIsChanged = newTitle !== "" && newTitle !== defaultTitle.trim();

                const isNowEdited =
                    instanceEditData.date !== baseDate ||
                    instanceEditData.endDate !== baseDate ||
                    (instanceEditData.startTime || "") !== (activeActivityStartTime || "") ||
                    (instanceEditData.endTime || "") !== (activeActivityEndTime || "") ||
                    titleIsChanged;

                return {
                    ...inst,
                    date: instanceEditData.date,
                    endDate: instanceEditData.endDate,
                    startTime: instanceEditData.startTime,
                    endTime: instanceEditData.endTime,
                    customTitle: titleIsChanged ? newTitle : null,
                    isEdited: isNowEdited
                };
            }
            return inst;
        }));
        setEditingInstanceId(null);

        showUndoNotification("Úprava instance uložena", () => {
            setCurrentRecurrenceInstances(previousInstances);
        });
    };

    const cancelEditingInstance = () => {
        setEditingInstanceId(null);
    };

    const restoreRecurrenceInstance = (e, instanceId) => {
        e.stopPropagation();
        const previousInstances = JSON.parse(JSON.stringify(currentRecurrenceInstances));

        setCurrentRecurrenceInstances(prev => prev.map(inst => {
            if (inst.id === instanceId) {
                const baseDate = inst.originalDate || inst.date;
                return {
                    ...inst,
                    date: baseDate,
                    endDate: baseDate,
                    startTime: activeActivityStartTime,
                    endTime: activeActivityEndTime,
                    customTitle: null,
                    isEdited: false
                };
            }
            return inst;
        }));

        showUndoNotification("Generované hodnoty obnoveny", () => {
            setCurrentRecurrenceInstances(previousInstances);
        });
    };

    const noteTitleRef = useRef(null);
    const linkDropdownRef = useRef(null);
    const noteEditorRef = useRef(null);
    const projectTitleRef = useRef(null);
    const projectLinkDropdownRef = useRef(null);
    const projectEditorRef = useRef(null);
    const activityTitleRef = useRef(null);
    const activityLinkDropdownRef = useRef(null);
    const activityEditorRef = useRef(null);
    const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
    const [linkSearchQuery, setLinkSearchQuery] = useState("");
    const [isLinkDropdownOpen, setIsLinkDropdownOpen] = useState(false);

    useEffect(() => {
        if (isNoteEditorOpen && noteTitleRef.current) {
            noteTitleRef.current.style.height = 'auto';
            noteTitleRef.current.style.height = (noteTitleRef.current.scrollHeight + 2) + 'px';
        }
        if (isProjectEditorOpen && projectTitleRef.current) {
            projectTitleRef.current.style.height = 'auto';
            projectTitleRef.current.style.height = (projectTitleRef.current.scrollHeight + 2) + 'px';
        }
        if (isActivityEditorOpen && activityTitleRef.current) {
            activityTitleRef.current.style.height = 'auto';
            activityTitleRef.current.style.height = (activityTitleRef.current.scrollHeight + 2) + 'px';
        }
    }, [isNoteEditorOpen, activeNoteTitle, isProjectEditorOpen, activeProjectTitle, isActivityEditorOpen, activeActivityTitle]);

    const [sortConfig, setSortConfig] = useState({
        topLevel: {
            enabled: true,
            typeOrder: ['note', 'task', 'project', 'event'],
            internalSort: { event: 'dateAsc', task: 'none', note: 'none', project: 'dateAsc' }
        },
        subLevel: {
            enabled: true,
            typeOrder: ['note', 'task', 'project', 'event'],
            internalSort: { event: 'dateAsc', task: 'none', note: 'none', project: 'dateAsc' }
        }
    });

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const getTodayStr = () => getDateStr(new Date());

    const getDayName = (dateStr) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isNaN(date.getTime())) return "";
        return DAY_NAMES_SHORT[date.getDay()];
    };

    const formatDate = (d) => d ? d.replace(/-/g, '.') : "";

    const [events, setEvents] = useState(defaultEvents);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [addingToDate, setAddingToDate] = useState(null);

    useEffect(() => {
        const hydrateInstances = (evs) => {
            return evs.map(e => {
                if ((e.activityType === 'recurring' || e.activityType === 'multi_recurring') && (!e.recurrenceInstances || e.recurrenceInstances.length === 0)) {
                    const instances = generateRecurrenceInstances(
                        e.intervalStart,
                        e.intervalEnd,
                        e.recurrencePattern,
                        e.recurrenceInterval || 1,
                        e.recurrenceUnit || 'day',
                        e.recurrenceDays || [],
                        e.startTime,
                        e.endTime,
                        e.recurrenceWeeks || ['odd', 'even'],
                        e.multiDefs || []
                    );

                    // PŘIDÁNO: Specifická data pro poslední lekci kurzu 4001
                    if (e.id === 4001 && instances.length > 0) {
                        const lastInst = instances[instances.length - 1];
                        lastInst.linkedNoteIds = [40];
                        lastInst.subtasks = [{
                            id: 400199,
                            title: "Pořádně se obléct",
                            type: "task",
                            completed: false,
                            subtasks: []
                        }];
                    }

                    return {
                        ...e,
                        recurrenceInstances: instances
                    };
                }
                return e;
            });
        };

        const savedEvents = localStorage.getItem('calendarAppV8_Demo_v7');
        if (savedEvents) {
            try {
                const parsed = JSON.parse(savedEvents);
                setEvents(hydrateInstances(parsed));
            } catch (e) { console.error(e); }
        } else {
            setEvents(prev => hydrateInstances(prev));
        }

        const savedNotes = localStorage.getItem('calendarAppV8_Notes_v7');
        if (savedNotes) {
            try {
                setSharedNotes(JSON.parse(savedNotes));
            } catch (e) { console.error(e); }
        } else {
            setSharedNotes(defaultSharedNotes);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('calendarAppV8_Demo_v7', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        localStorage.setItem('calendarAppV8_Notes_v7', JSON.stringify(sharedNotes));
    }, [sharedNotes]);

    useEffect(() => {
        const closeDropdowns = (e) => {
            if (openTypeDropdownId !== null && !document.getElementById(`type-wrap-${openTypeDropdownId}`)?.contains(e.target)) {
                setOpenTypeDropdownId(null);
            }
            if (openActionMenuId !== null && !document.getElementById(`action-wrap-${openActionMenuId}`)?.contains(e.target)) {
                setOpenActionMenuId(null);
            }
            if (isLinkDropdownOpen && linkDropdownRef.current && !linkDropdownRef.current.contains(e.target)) {
                if (noteEditorRef.current && noteEditorRef.current.contains(e.target)) {
                    setIsLinkDropdownOpen(false);
                }
            }
            if (isLinkDropdownOpen && projectLinkDropdownRef.current && !projectLinkDropdownRef.current.contains(e.target)) {
                if (projectEditorRef.current && projectEditorRef.current.contains(e.target)) {
                    setIsLinkDropdownOpen(false);
                }
            }
            if (isLinkDropdownOpen && activityLinkDropdownRef.current && !activityLinkDropdownRef.current.contains(e.target)) {
                if (activityEditorRef.current && activityEditorRef.current.contains(e.target)) {
                    setIsLinkDropdownOpen(false);
                }
            }
        };
        window.addEventListener('click', closeDropdowns);
        return () => window.removeEventListener('click', closeDropdowns);
    }, [openTypeDropdownId, openActionMenuId, isLinkDropdownOpen]);

    const findItemAndParent = (items, id, parent = null) => {
        for (let item of items) {
            if (item.id === id) return { item, parent };
            if (item.subtasks && item.subtasks.length > 0) {
                const found = findItemAndParent(item.subtasks, id, item);
                if (found) return found;
            }
            if (item.recurrenceInstances && item.recurrenceInstances.length > 0) {
                const found = findItemAndParent(item.recurrenceInstances, id, item);
                if (found) return found;
            }
        }
        return null;
    };

    const updateTree = (items, id, updateFn) => {
        return items.map(item => {
            if (item.id === id) return updateFn(item);

            let newItem = { ...item };

            if (newItem.subtasks && newItem.subtasks.length > 0) {
                newItem.subtasks = updateTree(newItem.subtasks, id, updateFn);
            }
            if (newItem.recurrenceInstances && newItem.recurrenceInstances.length > 0) {
                newItem.recurrenceInstances = updateTree(newItem.recurrenceInstances, id, updateFn);
            }

            return newItem;
        });
    };

    const getDisplayTitle = (item, parent) => {
        if (item.isGenerated && parent && parent.recurrenceInstances) {
            const instances = parent.recurrenceInstances;
            const sortedListInstances = [...instances].sort((a, b) => {
                const dateA = a.date || "";
                const dateB = b.date || "";
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                return (a.startTime || "").localeCompare(b.startTime || "");
            });

            const sourceTotals = {};
            sortedListInstances.forEach(i => {
                if (!i.isSuppressed) {
                    const sIdx = i._sourceIdx || 0;
                    sourceTotals[sIdx] = (sourceTotals[sIdx] || 0) + 1;
                }
            });

            const sourceCurrents = {};
            let currentD = 0;
            for (let i = 0; i < sortedListInstances.length; i++) {
                const inst = sortedListInstances[i];
                if (!inst.isSuppressed) {
                    const sIdx = inst._sourceIdx || 0;
                    sourceCurrents[sIdx] = (sourceCurrents[sIdx] || 0) + 1;
                }
                if (inst.id === item.id) {
                    currentD = sourceCurrents[inst._sourceIdx || 0] || 0;
                    break;
                }
            }

            const totalS = sourceTotals[item._sourceIdx || 0] || 0;

            let rawTitle = "";
            if (parent.activityType === 'multi_recurring') {
                rawTitle = item.customTitle || "Bez názvu";
            } else {
                rawTitle = item.customTitle || parent.title || "Bez názvu";
            }

            return item.isSuppressed ? rawTitle : rawTitle.replace(/<d>/g, currentD).replace(/<s>/g, totalS).replace(/<n>/g, parent.title || "");
        }

        return item.title || item.customTitle || (parent ? parent.title : "Bez názvu");
    };

    const findLinkedItems = (noteId) => {
        const linkedItems = [];
        const traverse = (items, parent = null) => {
            items.forEach(item => {
                if (item.linkedNoteIds?.includes(noteId)) {
                    linkedItems.push({
                        ...item,
                        title: getDisplayTitle(item, parent),
                        type: item.type || (parent ? parent.type : 'event')
                    });
                }
                if (item.subtasks) traverse(item.subtasks, item);
                if (item.recurrenceInstances) traverse(item.recurrenceInstances, item);
            });
        };
        traverse(events);

        return linkedItems.sort((a, b) => {
            const getScore = (t) => t === 'project' ? 1 : (t === 'event' || t === 'task' ? 2 : 3);
            const scoreA = getScore(a.type);
            const scoreB = getScore(b.type);

            if (scoreA !== scoreB) return scoreA - scoreB;

            const dateA = a.start || "";
            const dateB = b.start || "";

            if (dateA && dateB) {
                const dateComp = dateA.localeCompare(dateB);
                if (dateComp !== 0) return dateComp;
            }
            if (dateA && !dateB) return -1;
            if (dateA && !dateB) return 1;

            return (a.title || "").localeCompare(b.title || "");
        });
    };

    const getSortedItems = (items, level) => {
        const config = level === 0 ? sortConfig.topLevel : sortConfig.subLevel;

        if (!config.enabled) return items;

        const buckets = { event: [], task: [], note: [], project: [] };
        const unknown = [];

        items.forEach(item => {
            if (buckets[item.type]) buckets[item.type].push(item);
            else unknown.push(item);
        });

        const getSortFn = (sortType) => {
            return (a, b) => {
                if (sortType === 'az') return (a.title || "").localeCompare(b.title || "");
                if (sortType === 'za') return (b.title || "").localeCompare(a.title || "");
                if (sortType === 'dateAsc') return (a.start || "9999").localeCompare(b.start || "9999");
                if (sortType === 'dateDesc') return (b.start || "0000").localeCompare(a.start || "0000");
                return 0;
            };
        };

        Object.keys(buckets).forEach(type => {
            const sortMethod = config.internalSort[type] || 'none';
            if (sortMethod !== 'none') {
                buckets[type].sort(getSortFn(sortMethod));
            }
        });

        const result = [];
        config.typeOrder.forEach(type => {
            result.push(...buckets[type]);
        });
        result.push(...unknown);

        return result;
    };

    const flattenEvents = (items, parentId = "") => {
        let rows = [];
        items.forEach(item => {
            const safeTitle = `"${(item.title || "").replace(/"/g, '""')}"`;
            const linkedNotesStr = (item.linkedNoteIds || []).join("|");

            const row = {
                id: item.id,
                parentId: parentId,
                title: safeTitle,
                type: item.type,
                completed: item.completed ? 1 : 0,
                start: item.start || "",
                end: item.end || "",
                startTime: item.startTime || "",
                endTime: item.endTime || "",
                linkedNotes: linkedNotesStr
            };
            rows.push(row);
            if (item.subtasks && item.subtasks.length > 0) {
                rows = rows.concat(flattenEvents(item.subtasks, item.id));
            }
            if (item.recurrenceInstances && item.recurrenceInstances.length > 0) {
                rows = rows.concat(flattenEvents(item.recurrenceInstances, item.id));
            }
        });
        return rows;
    };

    const exportToCSV = () => {
        const flatData = flattenEvents(events);
        const header = "id,parentId,title,type,completed,start,end,startTime,endTime,linkedNotes\n";
        const csvContent = header + flatData.map(row =>
            `${row.id},${row.parentId},${row.title},${row.type},${row.completed},${row.start},${row.end},${row.startTime},${row.endTime},${row.linkedNotes}`
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "kalendar_data.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const importFromCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const lines = text.split("\n");

            if (lines.length < 2) {
                setWarningMsg("Soubor neobsahuje žádná data nebo je poškozen.");
                setTimeout(() => setWarningMsg(null), 5000);
                return;
            }

            const items = [];
            const itemMap = {};

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
                const matches = [];
                let match;
                while (match = regex.exec(line)) {
                    matches.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
                }

                if (matches.length > 10) matches.shift();

                if (matches.length >= 9) {
                    let linkedIds = [];
                    if (matches[9] && matches[9].trim() !== "") {
                        linkedIds = matches[9].split("|").map(Number).filter(n => !isNaN(n));
                    }

                    const newItem = {
                        id: Number(matches[0]),
                        parentId: matches[1] ? Number(matches[1]) : null,
                        title: matches[2],
                        type: matches[3],
                        completed: matches[4] === "1",
                        start: matches[5],
                        end: matches[6],
                        startTime: matches[7],
                        endTime: matches[8],
                        linkedNoteIds: linkedIds,
                        subtasks: []
                    };
                    items.push(newItem);
                    itemMap[newItem.id] = newItem;
                }
            }

            const rootItems = [];
            items.forEach(item => {
                if (item.parentId && itemMap[item.parentId]) {
                    itemMap[item.parentId].subtasks.push(item);
                } else {
                    rootItems.push(item);
                }
            });

            setEvents(rootItems);
            setWarningMsg("Data byla úspěšně importována.");
            setTimeout(() => setWarningMsg(null), 3000);
        };
        reader.readAsText(file);
    };

    const handleDeleteAll = () => {
        if (deleteConfirmationLevel < 3) {
            setDeleteConfirmationLevel(prev => prev + 1);
        } else {
            setEvents([]);
            setDeleteConfirmationLevel(0);
            setWarningMsg("Všechna data byla vymazána.");
            setTimeout(() => setWarningMsg(null), 3000);
        }
    };

    const showUndoNotification = (message, restoreCallback) => {
        if (undoData?.timeoutId) clearTimeout(undoData.timeoutId);
        const timeoutId = setTimeout(() => {
            setUndoData(null);
        }, 5000);

        setUndoData({
            message,
            action: restoreCallback,
            timeoutId
        });
    };

    const handleUndo = () => {
        if (!undoData) return;
        undoData.action();
        if (undoData.timeoutId) clearTimeout(undoData.timeoutId);
        setUndoData(null);
    };

    const handleOpenNotePicker = (targetId) => {
        setTargetItemIdForNote(targetId);
        setIsNotePickerOpen(true);
        setOpenActionMenuId(null);
    };

    const handleLinkNote = (noteId) => {
        if (!targetItemIdForNote) return;

        const previousEvents = JSON.parse(JSON.stringify(events));

        setEvents(prev => updateTree(prev, targetItemIdForNote, (item) => {
            const currentLinks = item.linkedNoteIds || [];
            if (currentLinks.includes(noteId)) return item;
            return { ...item, linkedNoteIds: [...currentLinks, noteId] };
        }));

        setIsNotePickerOpen(false);
        setTargetItemIdForNote(null);

        showUndoNotification("Poznámka připojena", () => setEvents(previousEvents));
    };

    const handleCreateNewNote = () => {
        const newId = Date.now();
        const newNote = { id: newId, title: "", content: "", type: "text", isPinned: false };

        setSharedNotes(prev => ({ ...prev, [newId]: newNote }));

        setActiveNoteId(newId);
        setActiveNoteTitle("");
        setActiveNoteContent("");
        setActiveNoteType("text");
        setTempNoteLinks(new Set());
        setOriginalNoteLinks(new Set());
        setIsNoteEditorOpen(true);
    };

    const handleCreateAndLinkNote = () => {
        const newId = Date.now();
        const newNote = { id: newId, title: "Nová poznámka", content: "", type: "text", isPinned: false };

        setSharedNotes(prev => ({ ...prev, [newId]: newNote }));
        handleLinkNote(newId);

        setTimeout(() => {
            handleOpenNoteEditor(newId);
        }, 100);
    };

    const handleCreateNewProject = () => {
        const newId = Date.now();
        const newProject = {
            id: newId, title: "", type: 'project', start: "", end: "", completed: false, isPinned: false, subtasks: [], linkedNoteIds: []
        };

        setEvents(prev => [...prev, newProject]);

        setActiveProjectId(newId);
        setActiveProjectTitle("");
        setActiveProjectCompleted(false);
        setTempProjectLinks(new Set());
        setIsProjectEditorOpen(true);
    };

    const handleCreateNewActivity = () => {
        const newId = Date.now();

        setActiveActivityId(newId);
        setActiveActivityTitle("");
        setActiveActivityStart("");
        setActiveActivityEnd("");
        setActiveActivityStartTime("");
        setActiveActivityEndTime("");
        setActiveActivityCompleted(false);
        setActiveActivityType("single");
        setActiveActivityIntervalStart("");
        setActiveActivityIntervalEnd("");
        setActiveActivityMultiDefs([]);

        setActiveActivityRecurrencePattern("daily");
        setActiveActivityRecurrenceInterval(1);
        setActiveActivityRecurrenceUnit("day");
        setActiveActivityRecurrenceDays([]);
        setActiveActivityRecurrenceWeeks(['odd', 'even']);

        lastRecurrenceSignature.current = JSON.stringify({
            start: "", end: "", pattern: "daily", interval: 1, unit: "day", days: [], startTime: "", endTime: "", weeks: ['odd', 'even'], multiDefs: []
        });

        setCurrentRecurrenceInstances([]);

        setTempActivityLinks(new Set());
        setTempStatusChanges({});
        setTargetParentIdForNewActivity(null); // null zajistí, že to bude hlavní aktivita

        setIsLinkDropdownOpen(false);
        setIsActivityEditorOpen(true);
        bringToFront('activity');
    };

    const handleUnlinkNote = (itemId, noteId) => {
        const previousEvents = JSON.parse(JSON.stringify(events));

        setEvents(prev => updateTree(prev, itemId, (item) => ({
            ...item,
            linkedNoteIds: (item.linkedNoteIds || []).filter(id => id !== noteId)
        })));

        showUndoNotification("Odkaz na poznámku odstraněn", () => setEvents(previousEvents));
    };

    const handleDeleteSharedNote = (noteId) => {
        const prevNotes = { ...sharedNotes };
        const newNotes = { ...sharedNotes };
        delete newNotes[noteId];
        setSharedNotes(newNotes);

        showUndoNotification("Poznámka smazána", () => {
            setSharedNotes(prevNotes);
        });
    };

    const togglePinNote = (noteId) => {
        const previousNotes = { ...sharedNotes };
        const wasPinned = previousNotes[noteId]?.isPinned;

        setSharedNotes(prev => ({
            ...prev,
            [noteId]: { ...prev[noteId], isPinned: !prev[noteId].isPinned }
        }));

        const msg = wasPinned ? "Poznámka odepnuta" : "Poznámka připnuta";
        showUndoNotification(msg, () => setSharedNotes(previousNotes));
    };

    const togglePinProject = (projectId) => {
        const { item } = findItemAndParent(events, projectId);
        if (!item) return;

        const previousEvents = JSON.parse(JSON.stringify(events));
        const wasPinned = item.isPinned;

        setEvents(prev => updateTree(prev, projectId, (itm) => ({ ...itm, isPinned: !itm.isPinned })));

        const msg = wasPinned ? "Projekt odepnut" : "Projekt připnut";
        showUndoNotification(msg, () => setEvents(previousEvents));
    };

    const handleDeleteProject = (projectId) => {
        const previousEvents = JSON.parse(JSON.stringify(events));
        setEvents(prev => deleteEventRecursive(prev, projectId));
        showUndoNotification("Projekt smazán", () => {
            setEvents(previousEvents);
        });
    };

    const handleOpenNoteEditor = (noteId) => {
        if (isNoteEditorOpen && activeNoteId === noteId) {
            setWarningMsg({
                text: "Záznam už máte otevřený. Přejít na něj?",
                action: () => {
                    bringToFront('note');
                    setWarningMsg(null);
                }
            });
            setTimeout(() => setWarningMsg(null), 5000);
            return;
        }

        bringToFront('note');
        const note = sharedNotes[noteId];
        if (note) {
            setActiveNoteId(noteId);
            setActiveNoteTitle(note.title);
            setActiveNoteContent(note.content);
            setActiveNoteType(note.type || 'text');
            setLinkSearchQuery("");

            const linkedIds = new Set();
            getAllTasksFlat(events).forEach(t => {
                if (t.linkedNoteIds?.includes(noteId)) {
                    linkedIds.add(t.id);
                }
            });
            setTempNoteLinks(linkedIds);
            setOriginalNoteLinks(linkedIds);
            setTempStatusChanges({});

            setIsLinkDropdownOpen(false);
            setIsNoteEditorOpen(true);
        }
    };

    const handleOpenProjectEditor = (projectId) => {
        if (isProjectEditorOpen && activeProjectId === projectId) {
            setWarningMsg({
                text: "Záznam už máte otevřený. Přejít na něj?",
                action: () => {
                    bringToFront('project');
                    setWarningMsg(null);
                }
            });
            setTimeout(() => setWarningMsg(null), 5000);
            return;
        }

        bringToFront('project');
        const foundObj = findItemAndParent(events, projectId);
        const item = foundObj ? foundObj.item : null;
        if (item) {
            setActiveProjectId(projectId);
            setActiveProjectTitle(item.title);
            setActiveProjectCompleted(item.completed);

            const linkedIds = new Set(item.linkedNoteIds || []);
            setTempProjectLinks(linkedIds);
            setTempStatusChanges({});

            setLinkSearchQuery("");
            setIsLinkDropdownOpen(false);
            setIsProjectEditorOpen(true);
        }
    };

    const handleOpenActivityEditor = (activityId) => {
        if (isActivityEditorOpen && activeActivityId === activityId) {
            setWarningMsg({
                text: "Záznam už máte otevřený. Přejít na něj?",
                action: () => {
                    bringToFront('activity');
                    setWarningMsg(null);
                }
            });
            setTimeout(() => setWarningMsg(null), 5000);
            return;
        }

        bringToFront('activity');
        const foundObj = findItemAndParent(events, activityId);
        const item = foundObj ? foundObj.item : null;
        if (item) {
            setActiveActivityId(activityId);
            setActiveActivityTitle(item.title);
            setActiveActivityStart(item.start || "");
            setActiveActivityEnd(item.end || "");
            setActiveActivityStartTime(item.startTime || "");
            setActiveActivityEndTime(item.endTime || "");
            setActiveActivityCompleted(item.completed);
            setActiveActivityType(item.activityType || 'single');

            setActiveActivityIntervalStart(item.intervalStart || "");
            setActiveActivityIntervalEnd(item.intervalEnd || "");

            setActiveActivityRecurrencePattern(item.recurrencePattern || "daily");
            setActiveActivityRecurrenceInterval(item.recurrenceInterval || 1);
            setActiveActivityRecurrenceUnit(item.recurrenceUnit || "day");
            setActiveActivityRecurrenceDays(item.recurrenceDays || []);
            setActiveActivityRecurrenceWeeks(item.recurrenceWeeks || ['odd', 'even']);

            // Načtení Multi-definitions
            let loadedDefs = item.multiDefs || [];
            if (item.activityType === 'multi_recurring' && loadedDefs.length === 0) {
                loadedDefs = [{ startTime: "", endTime: "", title: "" }];
            }
            setActiveActivityMultiDefs(loadedDefs);

            lastRecurrenceSignature.current = JSON.stringify({
                start: item.intervalStart || "",
                end: item.intervalEnd || "",
                pattern: item.recurrencePattern || "daily",
                interval: item.recurrenceInterval || 1,
                unit: item.recurrenceUnit || "day",
                days: (item.recurrenceDays || []).sort(),
                startTime: item.startTime || "",
                endTime: item.endTime || "",
                weeks: (item.recurrenceWeeks || ['odd', 'even']).sort(),
                multiDefs: loadedDefs
            });

            setCurrentRecurrenceInstances(item.recurrenceInstances || []);

            const linkedIds = new Set(item.linkedNoteIds || []);
            setTempActivityLinks(linkedIds);
            setTempStatusChanges({});

            setLinkSearchQuery("");
            setIsLinkDropdownOpen(false);
            setIsActivityEditorOpen(true);
        }
    };

    const handleCreateNoteForActivity = (e, activityId) => {
        e.stopPropagation();
        const newId = Date.now();

        const newNote = { id: newId, title: "", content: "", type: "text", isPinned: false };
        setSharedNotes(prev => ({ ...prev, [newId]: newNote }));

        setActiveNoteId(newId);
        setActiveNoteTitle("");
        setActiveNoteContent("");
        setActiveNoteType("text");

        const links = new Set();
        links.add(activityId);
        setTempNoteLinks(links);
        setOriginalNoteLinks(new Set());
        setTempStatusChanges({});

        setIsLinkDropdownOpen(false);
        setIsNoteEditorOpen(true);
        bringToFront('note');
    };

    const handleCreateActivityForActivity = (e, parentId) => {
        e.stopPropagation();
        const newId = Date.now();

        setActiveActivityId(newId);
        setActiveActivityTitle("");
        setActiveActivityStart("");
        setActiveActivityEnd("");
        setActiveActivityStartTime("");
        setActiveActivityEndTime("");
        setActiveActivityCompleted(false);
        setActiveActivityType("single");
        setActiveActivityIntervalStart("");
        setActiveActivityIntervalEnd("");
        setActiveActivityMultiDefs([]);

        setActiveActivityRecurrencePattern("daily");
        setActiveActivityRecurrenceInterval(1);
        setActiveActivityRecurrenceUnit("day");
        setActiveActivityRecurrenceDays([]);
        setActiveActivityRecurrenceWeeks(['odd', 'even']);

        lastRecurrenceSignature.current = JSON.stringify({
            start: "", end: "", pattern: "daily", interval: 1, unit: "day", days: [], startTime: "", endTime: "", weeks: ['odd', 'even'], multiDefs: []
        });

        setCurrentRecurrenceInstances([]);

        setTempActivityLinks(new Set());
        setTempStatusChanges({});
        setTargetParentIdForNewActivity(parentId);

        setIsLinkDropdownOpen(false);
        setIsActivityEditorOpen(true);
        bringToFront('activity');
    };

    const handleSaveNoteContent = () => {
        if (activeNoteId) {
            const previousNotes = { ...sharedNotes };
            const previousEvents = JSON.parse(JSON.stringify(events));

            setSharedNotes(prev => {
                const existing = prev[activeNoteId] || { id: activeNoteId, isPinned: false, isHidden: false };

                return {
                    ...prev,
                    [activeNoteId]: {
                        ...existing,
                        title: activeNoteTitle,
                        content: activeNoteType === 'heading' ? "" : activeNoteContent,
                        type: activeNoteType
                    }
                };
            });

            const updateLinksAndStatusInTree = (items) => {
                return items.map(item => {
                    const shouldBeLinked = tempNoteLinks.has(item.id);
                    const currentLinks = item.linkedNoteIds || [];
                    const isAlreadyLinked = currentLinks.includes(activeNoteId);

                    let newLinks = currentLinks;
                    if (shouldBeLinked && !isAlreadyLinked) {
                        newLinks = [...currentLinks, activeNoteId];
                    } else if (!shouldBeLinked && isAlreadyLinked) {
                        newLinks = currentLinks.filter(id => id !== activeNoteId);
                    }

                    const newCompleted = tempStatusChanges[item.id] !== undefined ? tempStatusChanges[item.id] : item.completed;

                    let newItem = {
                        ...item,
                        completed: newCompleted,
                        linkedNoteIds: newLinks,
                    };
                    if (newItem.subtasks) newItem.subtasks = updateLinksAndStatusInTree(newItem.subtasks);
                    if (newItem.recurrenceInstances) newItem.recurrenceInstances = updateLinksAndStatusInTree(newItem.recurrenceInstances);
                    return newItem;
                });
            };

            setEvents(prev => updateLinksAndStatusInTree(prev));

            if (isProjectEditorOpen && activeProjectId) {
                const isLinkedNow = tempNoteLinks.has(activeProjectId);
                setTempProjectLinks(prev => {
                    const next = new Set(prev);
                    if (isLinkedNow) next.add(activeNoteId); else next.delete(activeNoteId);
                    return next;
                });
            }

            showUndoNotification("Změny v poznámce uloženy", () => {
                setSharedNotes(previousNotes);
                setEvents(previousEvents);
            });
        }
        setIsNoteEditorOpen(false);
        setActiveNoteId(null);
        setTempStatusChanges({});
    };

    const handleSaveProject = () => {
        if (activeProjectId) {
            const previousEvents = JSON.parse(JSON.stringify(events));

            const applyStatusChangesRecursive = (items) => {
                return items.map(item => {
                    const newCompleted = tempStatusChanges[item.id] !== undefined ? tempStatusChanges[item.id] : item.completed;
                    let newItem = {
                        ...item,
                        completed: newCompleted,
                    };
                    if (item.subtasks) newItem.subtasks = applyStatusChangesRecursive(item.subtasks);
                    if (item.recurrenceInstances) newItem.recurrenceInstances = applyStatusChangesRecursive(item.recurrenceInstances);
                    return newItem;
                });
            };

            setEvents(prev => {
                let nextEvents = applyStatusChangesRecursive(prev);

                nextEvents = updateTree(nextEvents, activeProjectId, (item) => ({
                    ...item,
                    title: activeProjectTitle,
                    completed: activeProjectCompleted,
                    linkedNoteIds: Array.from(tempProjectLinks)
                }));

                return nextEvents;
            });

            if (isNoteEditorOpen && activeNoteId) {
                const isLinkedNow = tempProjectLinks.has(activeNoteId);
                setTempNoteLinks(prev => {
                    const next = new Set(prev);
                    if (isLinkedNow) next.add(activeNoteId); else next.delete(activeNoteId);
                    return next;
                });
            }

            showUndoNotification("Změny v projektu uloženy", () => {
                setEvents(previousEvents);
            });
        }
        setIsProjectEditorOpen(false);
        setActiveProjectId(null);
        setTempStatusChanges({});
    };

    const handleSaveActivity = () => {
        if (activeActivityId) {
            const previousEvents = JSON.parse(JSON.stringify(events));

            const sDate = activeActivityStart;
            const eDate = activeActivityEnd;
            const sTime = activeActivityStartTime;
            const eTime = activeActivityEndTime;

            if (activeActivityType === 'multi_recurring') {
                if (!activeActivityTitle || !activeActivityTitle.trim()) {
                    setWarningMsg("Nelze uložit: Vyplňte prosím název skupiny aktivit (červeně podbarvené pole).");
                    setTimeout(() => setWarningMsg(null), 5000);
                    return;
                }
                if (!activeActivityIntervalStart || !activeActivityIntervalEnd) {
                    setWarningMsg("Nelze uložit: Vyplňte prosím datum začátku i konce intervalu.");
                    setTimeout(() => setWarningMsg(null), 5000);
                    return;
                }
                if (activeActivityMultiDefs.some(def => !def.title || !def.title.trim())) {
                    setWarningMsg("Nelze uložit: Vyplňte prosím názvy u všech přidružených aktivit uvnitř rozvrhu.");
                    setTimeout(() => setWarningMsg(null), 5000);
                    return;
                }
            }

            if (activeActivityType === 'single') {
                if (!sDate && (eDate || eTime)) {
                    setWarningMsg("Nelze zadat konec události bez vyplněného data začátku!");
                    setTimeout(() => setWarningMsg(null), 5000);
                    return;
                }
                if (sDate && eDate) {
                    if (sDate > eDate) {
                        setWarningMsg("Datum konce nemůže být před datem začátku!");
                        setTimeout(() => setWarningMsg(null), 5000);
                        return;
                    }
                    if (sDate === eDate) {
                        if (sTime && eTime && sTime > eTime) {
                            setWarningMsg("Čas konce nemůže být před časem začátku!");
                            setTimeout(() => setWarningMsg(null), 5000);
                            return;
                        }
                    }
                }
            }

            if (activeActivityType === 'recurring' || activeActivityType === 'multi_recurring') {
                if (activeActivityIntervalStart && activeActivityIntervalEnd && activeActivityIntervalStart > activeActivityIntervalEnd) {
                    setWarningMsg("Konec intervalu nemůže být před jeho začátkem!");
                    setTimeout(() => setWarningMsg(null), 5000);
                    return;
                }

                if (recurrenceNeedsUpdate) {
                    setWarningMsg("Před uložením musíte vyřešit změnu intervalu (klikněte na 'Přegenerovat' nebo 'Vrátit změny').");
                    setTimeout(() => setWarningMsg(null), 5000);
                    return;
                }

                if (currentRecurrenceInstances.length === 0) {
                    setWarningMsg("Nelze uložit: Podle zadaných parametrů nebyly vygenerovány žádné výskyty aktivit.");
                    setTimeout(() => setWarningMsg(null), 5000);
                    return;
                }
            }

            const foundObj = findItemAndParent(events, activeActivityId);
            const existingItem = foundObj ? foundObj.item : null;

            let newRecurrenceInstances = currentRecurrenceInstances;

            if (activeActivityType === 'single') {
                newRecurrenceInstances = [];
            }

            if (existingItem) {
                setEvents(prev => updateTree(prev, activeActivityId, (item) => ({
                    ...item,
                    title: activeActivityTitle,
                    start: activeActivityStart,
                    end: activeActivityEnd,
                    startTime: activeActivityStartTime,
                    endTime: activeActivityEndTime,
                    completed: activeActivityCompleted,
                    activityType: activeActivityType,
                    intervalStart: activeActivityIntervalStart,
                    intervalEnd: activeActivityIntervalEnd,
                    recurrencePattern: activeActivityRecurrencePattern,
                    recurrenceInterval: activeActivityRecurrenceInterval,
                    recurrenceUnit: activeActivityRecurrenceUnit,
                    recurrenceDays: activeActivityRecurrenceDays,
                    recurrenceWeeks: activeActivityRecurrenceWeeks,
                    recurrenceInstances: newRecurrenceInstances,
                    multiDefs: activeActivityMultiDefs, // Uložení definic
                    linkedNoteIds: Array.from(tempActivityLinks)
                })));
            } else {
                const newItem = {
                    id: activeActivityId,
                    title: activeActivityTitle,
                    start: activeActivityStart,
                    end: activeActivityEnd,
                    startTime: activeActivityStartTime,
                    endTime: activeActivityEndTime,
                    completed: activeActivityCompleted,
                    activityType: activeActivityType,
                    intervalStart: activeActivityIntervalStart,
                    intervalEnd: activeActivityIntervalEnd,
                    recurrencePattern: activeActivityRecurrencePattern,
                    recurrenceInterval: activeActivityRecurrenceInterval,
                    recurrenceUnit: activeActivityRecurrenceUnit,
                    recurrenceDays: activeActivityRecurrenceDays,
                    recurrenceWeeks: activeActivityRecurrenceWeeks,
                    recurrenceInstances: newRecurrenceInstances,
                    multiDefs: activeActivityMultiDefs,
                    linkedNoteIds: Array.from(tempActivityLinks),
                    subtasks: [],
                    type: 'event'
                };

                if (targetParentIdForNewActivity) {
                    setEvents(prev => updateTree(prev, targetParentIdForNewActivity, (parent) => ({
                        ...parent,
                        subtasks: [...(parent.subtasks || []), newItem]
                    })));
                    setExpandedIds(prev => [...prev, targetParentIdForNewActivity]);
                } else {
                    setEvents(prev => [...prev, newItem]);
                }
            }

            showUndoNotification("Změny v aktivitě uloženy", () => {
                setEvents(previousEvents);
            });
        }
        setIsActivityEditorOpen(false);
        setActiveActivityId(null);
        setTargetParentIdForNewActivity(null);
        setTempStatusChanges({});
        setIsRecurrenceInstancesOpen(false);
    };

    const getAllTasksFlat = (nodes, parent = null) => {
        let list = [];
        nodes.forEach(n => {
            const enrichedNode = {
                ...n,
                title: getDisplayTitle(n, parent),
                type: n.type || (parent ? parent.type : 'event'),
                isSuppressed: n.isSuppressed || false
            };
            list.push(enrichedNode);
            if (n.subtasks) list = list.concat(getAllTasksFlat(n.subtasks, enrichedNode));
            if (n.recurrenceInstances) list = list.concat(getAllTasksFlat(n.recurrenceInstances, enrichedNode));
        });
        return list;
    };

    const handleInlineTaskToggle = (taskId, shouldLink) => {
        if (!activeNoteId) return;

        const prevTempLinks = new Set(tempNoteLinks);

        setTempNoteLinks(prev => {
            const next = new Set(prev);
            if (shouldLink) {
                next.add(taskId);
            } else {
                next.delete(taskId);
            }
            return next;
        });

        if (!shouldLink) {
            showUndoNotification("Odkaz odstraněn", () => {
                setTempNoteLinks(prevTempLinks);
            });
        }
    };

    const handleInlineNoteToggleForProject = (noteId, shouldLink) => {
        if (!activeProjectId) return;

        const prevTempLinks = new Set(tempProjectLinks);

        setTempProjectLinks(prev => {
            const next = new Set(prev);
            if (shouldLink) {
                next.add(noteId);
            } else {
                next.delete(noteId);
            }
            return next;
        });

        if (!shouldLink) {
            showUndoNotification("Poznámka odpojena", () => {
                setTempProjectLinks(prevTempLinks);
            });
        }
    };

    const handleInlineNoteToggleForActivity = (noteId, shouldLink) => {
        if (!activeActivityId) return;

        const prevTempLinks = new Set(tempActivityLinks);

        setTempActivityLinks(prev => {
            const next = new Set(prev);
            if (shouldLink) {
                next.add(noteId);
            } else {
                next.delete(noteId);
            }
            return next;
        });

        if (!shouldLink) {
            showUndoNotification("Poznámka odpojena", () => {
                setTempActivityLinks(prevTempLinks);
            });
        }
    };


    const handleAddEvent = (dateKey) => {
        if (!newEventTitle.trim()) return;

        let defaultType = 'event';
        if (activeView === 'notes') defaultType = 'note';
        if (activeView === 'projects') defaultType = 'project';

        const newEvent = {
            id: Date.now(), title: newEventTitle, start: dateKey, end: dateKey, startTime: "", endTime: "", completed: false, type: defaultType, subtasks: []
        };
        setEvents(prev => [...prev, newEvent]);
        setNewEventTitle(""); setAddingToDate(null);
    };

    const updateEventField = (id, fieldOrUpdates, value) => {
        setEvents(prev => updateTree(prev, id, (item) => {
            if (typeof fieldOrUpdates === 'object') {
                return { ...item, ...fieldOrUpdates };
            }
            return { ...item, [fieldOrUpdates]: value };
        }));
    };

    const handleSaveEdit = (id) => {
        const { item } = findItemAndParent(events, id);
        if (!item) return;

        if (item.type === 'event' || item.type === 'project') {
            const sDate = item.start;
            const eDate = item.end;
            const sTime = item.startTime;
            const eTime = item.endTime;

            if (!sDate && (eDate || eTime)) {
                setWarningMsg("Nelze zadat konec události bez vyplněného data začátku!");
                setTimeout(() => setWarningMsg(null), 5000);
                return;
            }

            if (sDate && eDate) {
                if (sDate > eDate) {
                    setWarningMsg("Datum konce nemůže být před datem začátku!");
                    setTimeout(() => setWarningMsg(null), 5000);
                    return;
                }
                if (sDate === eDate) {
                    if (sTime && eTime && sTime > eTime) {
                        setWarningMsg("Čas konce nemůže být před časem začátku!");
                        setTimeout(() => setWarningMsg(null), 5000);
                        return;
                    }
                }
            }
        }

        const originalItemState = originalEvents[id];

        const newOriginals = { ...originalEvents };
        delete newOriginals[id];
        setOriginalEvents(newOriginals);
        setEditingId(null);

        if (originalItemState) {
            showUndoNotification("Změny uloženy", () => {
                setEvents(prev => updateTree(prev, id, () => originalItemState));
            });
        }
    };

    const handleCancelEdit = (id) => {
        if (originalEvents[id]) {
            setEvents(prev => updateTree(prev, id, () => originalEvents[id]));
            const newOriginals = { ...originalEvents };
            delete newOriginals[id];
            setOriginalEvents(newOriginals);
        }
        setEditingId(null);
    };

    const handleRequestEdit = (targetId) => {
        if (editingId !== null && editingId !== targetId) {
            setWarningMsg("Potvrďte úpravy v záznamu");
            setTimeout(() => setWarningMsg(null), 5000);
            return false;
        }
        return true;
    };

    const handleViewSwitch = (viewName) => {
        if (editingId !== null) {
            setWarningMsg("Potvrďte úpravy v záznamu");
            setTimeout(() => setWarningMsg(null), 5000);
            return;
        }
        setViewSearchQuery("");
        setActiveView(viewName);
    };

    const toggleComplete = (e, id) => {
        e?.stopPropagation();
        setEvents(prev => updateTree(prev, id, (item) => ({ ...item, completed: !item.completed })));
    };

    const handleToggleStatusWithUndo = (e, id) => {
        e.stopPropagation();
        const previousEvents = JSON.parse(JSON.stringify(events));

        const { item } = findItemAndParent(events, id);

        if (item) {
            setEvents(prev => updateTree(prev, id, (itm) => ({ ...itm, completed: !itm.completed })));
            showUndoNotification(item.completed ? "Úkol obnoven" : "Úkol splněn", () => {
                setEvents(previousEvents);
            });
        }
    };

    const toggleHideEvent = (e, id) => {
        e.stopPropagation();
        const { item } = findItemAndParent(events, id);
        if (!item) return;

        const previousEvents = JSON.parse(JSON.stringify(events));
        const wasHidden = item.isHidden;
        const typeLabel = item.type === 'project' ? "Projekt" : (item.isGenerated ? "Výskyt" : "Záznam");

        setEvents(prev => updateTree(prev, id, (itm) => ({ ...itm, isHidden: !itm.isHidden })));

        showUndoNotification(wasHidden ? `${typeLabel} zobrazen` : `${typeLabel} skryt`, () => setEvents(previousEvents));
    };

    const toggleHideSharedNote = (noteId) => {
        const prevNotes = { ...sharedNotes };
        const wasHidden = prevNotes[noteId]?.isHidden;

        setSharedNotes(prev => ({
            ...prev,
            [noteId]: { ...prev[noteId], isHidden: !wasHidden }
        }));

        showUndoNotification(wasHidden ? "Poznámka zobrazena" : "Poznámka skryta", () => setSharedNotes(prevNotes));
    };

    const deleteEventRecursive = (items, id) => {
        return items.filter(item => item.id !== id).map(item => {
            let newItem = { ...item };
            if (newItem.subtasks) newItem.subtasks = deleteEventRecursive(newItem.subtasks, id);
            if (newItem.recurrenceInstances) newItem.recurrenceInstances = deleteEventRecursive(newItem.recurrenceInstances, id);
            return newItem;
        });
    };

    const deleteEvent = (e, id) => {
        e?.stopPropagation();

        const { item } = findItemAndParent(events, id);
        if (!item) return;

        const previousEvents = JSON.parse(JSON.stringify(events));

        if (item.isGenerated) {
            setEvents(prev => updateTree(prev, id, (inst) => ({ ...inst, isSuppressed: true })));
            showUndoNotification("Výskyt potlačen", () => {
                setEvents(previousEvents);
            });
        } else {
            setEvents(prev => deleteEventRecursive(prev, id));
            showUndoNotification("Položka smazána", () => {
                setEvents(previousEvents);
            });
        }
        setOpenActionMenuId(null);
    };

    const duplicateEvent = (id) => {
        const { item, parent } = findItemAndParent(events, id);
        if (!item) return;

        const cloneItem = (itm) => ({
            ...JSON.parse(JSON.stringify(itm)),
            id: Date.now() + Math.random(),
            title: `${itm.title} (kopie)`,
            subtasks: itm.subtasks ? itm.subtasks.map(cloneItem) : []
        });

        const newItem = cloneItem(item);

        if (!parent) {
            const idx = events.findIndex(e => e.id === id);
            const newEvents = [...events];
            newEvents.splice(idx + 1, 0, newItem);
            setEvents(newEvents);
        } else {
            setEvents(prev => updateTree(prev, parent.id, (p) => ({
                ...p,
                subtasks: [...p.subtasks, newItem]
            })));
        }
        setOpenActionMenuId(null);
    };

    const addSubtask = (parentId) => {
        setEvents(prev => updateTree(prev, parentId, (item) => {
            const newItem = {
                id: Date.now(), title: "", type: item.type === 'note' ? 'note' : 'task', completed: false,
                start: item.type === 'event' ? item.start : "", end: item.type === 'event' ? item.end : "",
                startTime: "", endTime: "", subtasks: []
            };
            if (!expandedIds.includes(parentId)) setExpandedIds(old => [...old, parentId]);
            return { ...item, subtasks: [...(item.subtasks || []), newItem] };
        }));
    };

    // --- ADVANCED DRAG & DROP ---

    const onDragStart = (e, id, level) => {
        if (activeView === 'list') {
        } else {
            const config = level === 0 ? sortConfig.topLevel : sortConfig.subLevel;
            const { item } = findItemAndParent(events, id);
            const itemType = item?.type;

            const canDrag = !editingId && (!config.enabled || (itemType && config.internalSort[itemType] === 'none'));

            if (!canDrag) {
                e.preventDefault();
                return;
            }
        }

        setDraggingId(id);
        dragItem.current = id;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };

    const onDragStartNote = (e, noteId, parentId) => {
        if (activeView !== 'list') return;
        e.stopPropagation();
        setDraggingNote({ id: noteId, parentId });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `note:${noteId}:${parentId}`);
    };

    const onDropNoteOnNote = (dragNoteId, dragParentId, targetParentId, targetNoteId, position) => {
        if (dragNoteId === targetNoteId && dragParentId === targetParentId) return;
        const previousEvents = JSON.parse(JSON.stringify(events));

        setEvents(prev => {
            let next = JSON.parse(JSON.stringify(prev));

            if (dragParentId === targetParentId) {
                next = updateTree(next, dragParentId, (p) => {
                    let links = [...(p.linkedNoteIds || [])];
                    links = links.filter(id => id !== dragNoteId);
                    const toIdx = links.indexOf(targetNoteId);
                    if (toIdx > -1) {
                        links.splice(position === 'before' ? toIdx : toIdx + 1, 0, dragNoteId);
                    } else {
                        links.push(dragNoteId);
                    }
                    return { ...p, linkedNoteIds: links };
                });
            } else {
                next = updateTree(next, dragParentId, (p) => ({
                    ...p,
                    linkedNoteIds: (p.linkedNoteIds || []).filter(id => id !== dragNoteId)
                }));
                next = updateTree(next, targetParentId, (p) => {
                    let links = [...(p.linkedNoteIds || [])];
                    const toIdx = links.indexOf(targetNoteId);
                    if (toIdx > -1) {
                        links.splice(position === 'before' ? toIdx : toIdx + 1, 0, dragNoteId);
                    } else {
                        links.push(dragNoteId);
                    }
                    return { ...p, linkedNoteIds: links };
                });
            }
            return next;
        });
        showUndoNotification("Poznámka přesunuta", () => setEvents(previousEvents));
    };

    const onDropNoteOnTask = (dragNoteId, dragParentId, targetTaskId, mode = 'link') => {
        if (dragParentId === targetTaskId && mode === 'move') return;

        const previousEvents = JSON.parse(JSON.stringify(events));
        const previousNotes = { ...sharedNotes };

        let noteIdToLink = dragNoteId;
        let isCopyAction = mode === 'copy';

        if (isCopyAction) {
            const originalNote = sharedNotes[dragNoteId];
            if (originalNote) {
                const newId = Date.now();
                const newNote = {
                    ...JSON.parse(JSON.stringify(originalNote)),
                    id: newId,
                    title: `${originalNote.title} (kopie)`
                };
                setSharedNotes(prev => ({ ...prev, [newId]: newNote }));
                noteIdToLink = newId;
            } else {
                return;
            }
        }

        setEvents(prev => {
            let next = JSON.parse(JSON.stringify(prev));

            if (mode === 'move') {
                next = updateTree(next, dragParentId, (p) => ({
                    ...p,
                    linkedNoteIds: (p.linkedNoteIds || []).filter(id => id !== dragNoteId)
                }));
            }

            next = updateTree(next, targetTaskId, (p) => {
                const currentLinks = p.linkedNoteIds || [];
                if (!currentLinks.includes(noteIdToLink)) {
                    return { ...p, linkedNoteIds: [...currentLinks, noteIdToLink] };
                }
                return p;
            });
            return next;
        });

        let msg = "Poznámka připojena";
        if (mode === 'move') msg = "Poznámka přesunuta";
        if (mode === 'copy') msg = "Poznámka zkopírována a připojena";

        showUndoNotification(msg, () => {
            setEvents(previousEvents);
            if (isCopyAction) setSharedNotes(previousNotes);
        });
    };

    const onDragEnd = (e) => {
        setDraggingId(null);
        setDraggingNote(null);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const triggerDropAnimation = (id) => {
        setJustDroppedId(id);
        setTimeout(() => setJustDroppedId(null), 2000);
    };

    const removeNode = (nodes, dragId) => {
        const result = [];
        for (const node of nodes) {
            if (node.id === dragId) continue;
            let newNode = { ...node };
            if (newNode.subtasks) newNode.subtasks = removeNode(newNode.subtasks, dragId);
            if (newNode.recurrenceInstances) newNode.recurrenceInstances = removeNode(newNode.recurrenceInstances, dragId);
            result.push(newNode);
        }
        return result;
    };

    const onMoveAsChild = (dragId, targetId) => {
        if (dragId === targetId) return;

        const { item: draggedNode } = findItemAndParent(events, dragId);
        if (!draggedNode) return;

        const { item: targetNode } = findItemAndParent(events, targetId);
        if (!targetNode || targetNode.subtasks?.some(s => s.id === dragId)) return;

        const previousEvents = JSON.parse(JSON.stringify(events));

        const insertAsChild = (nodes) => {
            return nodes.map(node => {
                if (node.id === targetId) {
                    return {
                        ...node,
                        subtasks: [...(node.subtasks || []), draggedNode]
                    };
                }
                let newNode = { ...node };
                if (newNode.subtasks) newNode.subtasks = insertAsChild(newNode.subtasks);
                if (newNode.recurrenceInstances) newNode.recurrenceInstances = insertAsChild(newNode.recurrenceInstances);
                return newNode;
            });
        };

        setEvents(prev => {
            const removed = removeNode([...prev], dragId);
            return insertAsChild(removed);
        });

        if (!expandedIds.includes(targetId)) {
            setExpandedIds(prev => [...prev, targetId]);
        }

        triggerDropAnimation(dragId);
        showUndoNotification("Položka přesunuta", () => setEvents(previousEvents));
    };

    const onMoveAsParent = (dragId, targetId) => {
        if (dragId === targetId) return;

        const { item: draggedNode } = findItemAndParent(events, dragId);
        if (!draggedNode) return;

        const previousEvents = JSON.parse(JSON.stringify(events));

        const insertAsParent = (nodes) => {
            return nodes.map(node => {
                if (node.id === targetId) {
                    const newParent = { ...draggedNode };
                    newParent.subtasks = [...(newParent.subtasks || []), node];
                    return newParent;
                }
                let newNode = { ...node };
                if (newNode.subtasks) newNode.subtasks = insertAsParent(newNode.subtasks);
                if (newNode.recurrenceInstances) newNode.recurrenceInstances = insertAsParent(newNode.recurrenceInstances);
                return newNode;
            });
        };

        setEvents(prev => {
            const treeWithoutDrag = removeNode([...prev], dragId);
            return insertAsParent(treeWithoutDrag);
        });

        if (!expandedIds.includes(dragId)) {
            setExpandedIds(prev => [...prev, dragId]);
        }

        triggerDropAnimation(dragId);
        showUndoNotification("Položka přesunuta", () => setEvents(previousEvents));
    };

    const removeNodeFromTree = (tree, id) => {
        let removedNode = null;
        const traverse = (nodes) => {
            const result = [];
            for (const node of nodes) {
                if (node.id === id) {
                    removedNode = node;
                    continue;
                }
                let newNode = { ...node };
                if (newNode.subtasks) {
                    newNode.subtasks = traverse(newNode.subtasks);
                }
                if (newNode.recurrenceInstances) {
                    newNode.recurrenceInstances = traverse(newNode.recurrenceInstances);
                }
                result.push(newNode);
            }
            return result;
        };
        const newTree = traverse([...tree]);
        return { newTree, removedNode };
    };

    const onMoveBefore = (dragId, targetId) => {
        if (dragId === targetId) return;

        const previousEvents = JSON.parse(JSON.stringify(events));

        const { newTree, removedNode } = removeNodeFromTree(events, dragId);
        if (!removedNode) return;

        const insertBefore = (nodes) => {
            const result = [];
            for (const node of nodes) {
                if (node.id === targetId) {
                    result.push(removedNode);
                    result.push(node);
                } else {
                    let newNode = { ...node };
                    if (newNode.subtasks) newNode.subtasks = insertBefore(newNode.subtasks);
                    if (newNode.recurrenceInstances) newNode.recurrenceInstances = insertBefore(newNode.recurrenceInstances);
                    result.push(newNode);
                }
            }
            return result;
        };

        setEvents(insertBefore(newTree));
        triggerDropAnimation(dragId);
        showUndoNotification("Položka přesunuta", () => setEvents(previousEvents));
    };

    const onMoveAfter = (dragId, targetId) => {
        if (dragId === targetId) return;

        const previousEvents = JSON.parse(JSON.stringify(events));

        const { newTree, removedNode } = removeNodeFromTree(events, dragId);
        if (!removedNode) return;

        const insertAfter = (nodes) => {
            const result = [];
            for (const node of nodes) {
                if (node.id === targetId) {
                    result.push(node);
                    result.push(removedNode);
                } else {
                    let newNode = { ...node };
                    if (newNode.subtasks) newNode.subtasks = insertAfter(newNode.subtasks);
                    if (newNode.recurrenceInstances) newNode.recurrenceInstances = insertAfter(newNode.recurrenceInstances);
                    result.push(newNode);
                }
            }
            return result;
        };

        setEvents(insertAfter(newTree));
        triggerDropAnimation(dragId);
        showUndoNotification("Položka přesunuta", () => setEvents(previousEvents));
    };


    const indentItem = (id) => {
        const moveInTree = (list) => {
            const idx = list.findIndex(i => i.id === id);
            if (idx > 0) {
                const prevSibling = list[idx - 1];
                const itemToMove = list[idx];
                const newList = [...list];
                newList.splice(idx, 1);
                const newPrevSibling = { ...prevSibling, subtasks: [...(prevSibling.subtasks || []), itemToMove] };
                newList[idx - 1] = newPrevSibling;
                if (!expandedIds.includes(prevSibling.id)) setExpandedIds(prev => [...prev, prevSibling.id]);
                return newList;
            }
            return list.map(item => {
                let newItem = { ...item };
                if (newItem.subtasks) newItem.subtasks = moveInTree(newItem.subtasks);
                if (newItem.recurrenceInstances) newItem.recurrenceInstances = moveInTree(newItem.recurrenceInstances);
                return newItem;
            });
        };
        setEvents(prev => moveInTree(prev));
        setOpenActionMenuId(null);
    };

    const outdentItem = (id) => {
        const processList = (list) => {
            const result = [];
            list.forEach(item => {
                let processedSubtasks = item.subtasks;
                let processedRecurrences = item.recurrenceInstances;

                let outdentedFromSub = null;
                let outdentedFromRec = null;

                if (item.subtasks) {
                    const idx = item.subtasks.findIndex(s => s.id === id);
                    if (idx !== -1) {
                        outdentedFromSub = item.subtasks[idx];
                        processedSubtasks = [...item.subtasks];
                        processedSubtasks.splice(idx, 1);
                    } else {
                        processedSubtasks = processList(item.subtasks);
                    }
                }

                if (item.recurrenceInstances) {
                    const idx = item.recurrenceInstances.findIndex(s => s.id === id);
                    if (idx !== -1) {
                        outdentedFromRec = item.recurrenceInstances[idx];
                        processedRecurrences = [...item.recurrenceInstances];
                        processedRecurrences.splice(idx, 1);
                    } else {
                        processedRecurrences = processList(item.recurrenceInstances);
                    }
                }

                result.push({ ...item, subtasks: processedSubtasks, recurrenceInstances: processedRecurrences });

                if (outdentedFromSub) result.push(outdentedFromSub);
                if (outdentedFromRec) result.push(outdentedFromRec);
            });
            return result;
        };
        setEvents(prev => processList(prev));
        setOpenActionMenuId(null);
    };

    const calculateStats = (items) => {
        let notes = 0;
        let projects = 0;
        let others = 0;
        let total = 0;

        const sharedNotesCount = Object.keys(sharedNotes).length;
        notes += sharedNotesCount;
        total += sharedNotesCount;

        const traverse = (list) => {
            list.forEach(item => {
                total++;
                if (item.type === 'note') notes++;
                else if (item.type === 'project') projects++;
                else others++;

                if (item.subtasks) traverse(item.subtasks);
                if (item.recurrenceInstances) traverse(item.recurrenceInstances);
            });
        };
        traverse(items);
        return { notes, projects, others, total };
    };

    const stats = calculateStats(events);

    const renderSectionHeader = (title, count, stateKey = null, icon = null) => {
        const isClickable = stateKey !== null;
        return (
            <div
                onClick={() => isClickable && toggleSection(stateKey)}
                className={`flex items-center gap-2 text-slate-700 font-bold uppercase text-sm mt-6 mb-3 select-none tracking-wide ${isClickable ? 'cursor-pointer hover:text-slate-900 group' : ''}`}
            >
                {icon && <div className={isClickable ? "text-slate-500 group-hover:text-slate-700 transition-colors" : "text-slate-500"}>{icon}</div>}

                <span>{title}</span>
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] min-w-[20px] text-center font-normal">{count}</span>
                <div className="h-px bg-slate-200 flex-1 ml-2 opacity-50"></div>
            </div>
        );
    };

    const renderList = () => {
        let eventsDisplay = [];

        if (activeView === 'list') {
            events.forEach(item => {
                if (item.type !== 'note' && item.type !== 'project') {
                    if (item.activityType === 'recurring' || item.activityType === 'multi_recurring') {
                        const instances = item.recurrenceInstances || [];
                        const sortedListInstances = [...instances].sort((a, b) => {
                            const dateA = a.date || "";
                            const dateB = b.date || "";
                            if (dateA !== dateB) return dateA.localeCompare(dateB);
                            return (a.startTime || "").localeCompare(b.startTime || "");
                        });

                        const sourceTotals = {};
                        sortedListInstances.forEach(i => {
                            if (!i.isSuppressed) {
                                const sIdx = i._sourceIdx || 0;
                                sourceTotals[sIdx] = (sourceTotals[sIdx] || 0) + 1;
                            }
                        });

                        const sourceCurrents = {};

                        sortedListInstances.forEach(inst => {
                            if (inst.isSuppressed) return;

                            const sIdx = inst._sourceIdx || 0;
                            sourceCurrents[sIdx] = (sourceCurrents[sIdx] || 0) + 1;
                            const currentD = sourceCurrents[sIdx];
                            const totalS = sourceTotals[sIdx] || 0;

                            // Pokud je to multi_recurring, bereme název z instance ( customTitle ), jinak od rodiče
                            let rawTitle = "";
                            if (item.activityType === 'multi_recurring') {
                                rawTitle = inst.customTitle || "Bez názvu";
                            } else {
                                rawTitle = inst.customTitle || item.title || "Bez názvu";
                            }

                            const displayTitle = rawTitle.replace(/<d>/g, currentD).replace(/<s>/g, totalS).replace(/<n>/g, item.title || "");

                            eventsDisplay.push({
                                ...item,
                                id: inst.id,
                                title: displayTitle,
                                start: inst.date,
                                end: inst.date,
                                startTime: inst.startTime,
                                endTime: inst.endTime,
                                completed: inst.completed,
                                isInstance: true,
                                isGenerated: true,
                                parentId: item.id,
                                subtasks: inst.subtasks || [],
                                linkedNoteIds: inst.linkedNoteIds || [],
                                isHidden: inst.isHidden || false
                            });
                        });
                    } else {
                        eventsDisplay.push(item);
                    }
                }
                if (item.type === 'project' && item.subtasks) {
                    const projectTasks = item.subtasks.filter(sub => sub.type !== 'note');
                    eventsDisplay.push(...projectTasks);
                }
            });

            if (viewSearchQuery) {
                const query = viewSearchQuery.toLowerCase();
                eventsDisplay = eventsDisplay.filter(e =>
                    (e.title || "").toLowerCase().includes(query)
                );
            }
        } else if (activeView === 'notes') {
            eventsDisplay = events.filter(e => e.type === 'note');
        } else if (activeView === 'projects') {
            eventsDisplay = events.filter(e => e.type === 'project');
        }

        if (activeView === 'list') {
            const hiddenItems = eventsDisplay.filter(item => item.isHidden);
            const sortedHidden = sortAndGroupItems(hiddenItems, listSortSettings.hidden);

            const visibleItems = eventsDisplay.filter(item => !item.isHidden);

            const noDateItems = visibleItems.filter(item => !item.start && !item.startTime && !item.end && !item.endTime);
            const sortedNoDate = sortAndGroupItems(noDateItems, listSortSettings.noDate);

            const withDateItems = visibleItems.filter(item => item.start || item.startTime || item.end || item.endTime);
            const sortedWithDate = sortAndGroupItems(withDateItems, listSortSettings.withDate);

            const listHandlers = {
                onDragStart, onDragEnd, onMoveBefore, onMoveAfter, onMoveAsChild, onMoveAsParent,
                draggingNote, onDragStartNote, onDropNoteOnNote, onDropNoteOnTask
            };
            const listActions = {
                toggleStatus: handleToggleStatusWithUndo,
                toggleHide: toggleHideEvent,
                deleteEvent,
                unlinkNote: handleUnlinkNote,
                deleteNote: handleDeleteSharedNote,
                createNoteForActivity: handleCreateNoteForActivity,
                createActivityForActivity: handleCreateActivityForActivity
            };

            const checkSortEnabled = (settings, itemType, isInstance) => {
                if (settings.group === 'none') return settings.actSort === 'custom';
                if (itemType === 'note') return settings.noteSort === 'custom';
                return settings.actSort === 'custom';
            };

            return (
                <div className="max-w-5xl mx-auto pb-20">
                    <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                            <input type="text" placeholder="Hledat aktivitu..." value={viewSearchQuery} onChange={(e) => setViewSearchQuery(e.target.value)} className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm shadow-sm" />
                            {viewSearchQuery && <button onClick={() => setViewSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                        </div>
                        <button onClick={handleCreateNewActivity} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm shrink-0"><Plus className="w-4 h-4" /> Nová aktivita</button>
                    </div>

                    {renderSectionHeader("Aktivity bez termínu", noDateItems.length, null, <List className="w-4 h-4" />)}
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-1 mb-6">
                        {sortedNoDate.length > 0 ? (
                            sortedNoDate.map(ev => (
                                <ListEventCard
                                    key={ev.id}
                                    item={ev}
                                    draggingId={draggingId}
                                    handlers={listHandlers}
                                    actions={listActions}
                                    isSortEnabled={checkSortEnabled(listSortSettings.noDate, ev.type, ev.isInstance)}
                                    getDayName={getDayName}
                                    getTodayStr={getTodayStr}
                                    sharedNotes={sharedNotes}
                                    onNoteClick={handleOpenNoteEditor}
                                    onActivityClick={handleOpenActivityEditor}
                                    sortSettings={listSortSettings.noDate}
                                />
                            ))
                        ) : (
                            <div className="text-xs text-slate-400 italic py-2 pl-2">Žádné úkoly bez termínu.</div>
                        )}
                    </div>

                    {renderSectionHeader("Aktivity s termínem", withDateItems.length, null, <CalendarIcon className="w-4 h-4" />)}
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-1 mb-6">
                        {sortedWithDate.length > 0 ? (
                            sortedWithDate.map(ev => (
                                <ListEventCard
                                    key={ev.id}
                                    item={ev}
                                    draggingId={draggingId}
                                    handlers={listHandlers}
                                    actions={listActions}
                                    isSortEnabled={checkSortEnabled(listSortSettings.withDate, ev.type, ev.isInstance)}
                                    getDayName={getDayName}
                                    getTodayStr={getTodayStr}
                                    sharedNotes={sharedNotes}
                                    onNoteClick={handleOpenNoteEditor}
                                    onActivityClick={handleOpenActivityEditor}
                                    sortSettings={listSortSettings.withDate}
                                />
                            ))
                        ) : (
                            <div className="text-xs text-slate-400 italic py-2 pl-2">Žádné úkoly s termínem.</div>
                        )}
                    </div>

                    {renderSectionHeader("Skryté aktivity", hiddenItems.length, 'hidden', <EyeOff className="w-4 h-4" />)}
                    {!sectionState.hidden && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-1">
                            {sortedHidden.length > 0 ? (
                                sortedHidden.map(ev => (
                                    <ListEventCard
                                        key={ev.id}
                                        item={ev}
                                        draggingId={draggingId}
                                        handlers={listHandlers}
                                        actions={listActions}
                                        isSortEnabled={checkSortEnabled(listSortSettings.hidden, ev.type, ev.isInstance)}
                                        getDayName={getDayName}
                                        getTodayStr={getTodayStr}
                                        sharedNotes={sharedNotes}
                                        onNoteClick={handleOpenNoteEditor}
                                        onActivityClick={handleOpenActivityEditor}
                                        sortSettings={listSortSettings.hidden}
                                    />
                                ))
                            ) : (
                                <div className="text-xs text-slate-400 italic py-2 pl-2">Žádné skryté aktivity.</div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        const sortedEvents = getSortedItems(eventsDisplay, 0);

        const renderNoteCard = (note) => {
            const linkedItems = findLinkedItems(note.id);
            const hasLinks = linkedItems.length > 0;
            const hasContent = note.type !== 'heading';
            const showHeaderMargin = hasContent || hasLinks;

            return (
                <div
                    key={note.id}
                    onClick={() => handleOpenNoteEditor(note.id)}
                    className="bg-yellow-50 border border-yellow-200 p-4 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer group relative flex flex-col mb-3 break-inside-avoid rounded-lg"
                >
                    <div className={`flex items-start justify-between gap-2 ${showHeaderMargin ? 'mb-2' : ''}`}>
                        <div className="flex items-center gap-2 font-bold text-black">
                            <StickyNote className="w-4 h-4 text-yellow-500 shrink-0" />
                            <span className="break-words">{note.title}</span>
                        </div>
                        {note.isPinned && <Pin className="w-3.5 h-3.5 text-yellow-600 fill-yellow-200 shrink-0" />}
                    </div>

                    {hasContent && (
                        <div className={`flex-1 ${hasLinks ? 'mb-2' : ''}`}>
                            <p className="text-xs text-black whitespace-pre-wrap leading-relaxed">{note.content || "Bez obsahu..."}</p>
                        </div>
                    )}

                    {hasLinks && (
                        <div className="mt-auto pt-2 flex flex-wrap gap-1">
                            {linkedItems.map(item => {
                                let label = item.title;
                                if (item.start && item.end && item.start !== item.end) {
                                    label = `${formatDate(item.start)} - ${formatDate(item.end)} - ${label}`;
                                } else if (item.start) {
                                    label = `${formatDate(item.start)} - ${label}`;
                                }

                                let chipClass = "bg-blue-50 text-blue-900 border-blue-200";
                                let iconClass = "text-blue-700";

                                if (item.type === 'project') {
                                    chipClass = "bg-purple-50 text-purple-800 border-purple-200";
                                    iconClass = "text-purple-600";
                                } else if (item.type === 'note') {
                                    chipClass = "bg-yellow-50 text-yellow-800 border-yellow-200";
                                    iconClass = "text-yellow-600";
                                }

                                if (item.isSuppressed) {
                                    chipClass = "bg-slate-100 text-slate-500 border-slate-300";
                                    iconClass = "text-slate-400";
                                }

                                return (
                                    <span key={item.id} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border h-auto ${chipClass}`}>
                                        {item.isSuppressed ? (
                                            <div className="w-4 h-4 flex items-center justify-center shrink-0 -ml-0.5"></div>
                                        ) : (
                                            <button
                                                onClick={(e) => handleToggleStatusWithUndo(e, item.id)}
                                                className={`w-4 h-4 flex items-center justify-center rounded-sm hover:bg-black/10 transition-colors shrink-0 -ml-0.5`}
                                            >
                                                {item.completed ?
                                                    <Check className="w-3 h-3 text-green-600" strokeWidth={3} /> :
                                                    <X className="w-3 h-3 text-red-500" strokeWidth={3} />
                                                }
                                            </button>
                                        )}
                                        <span className="w-px h-3 bg-current opacity-20 mx-0.5"></span>
                                        {renderTypeIcon(item.type, `w-3 h-3 ${iconClass} shrink-0`)}
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (item.type === 'project') handleOpenProjectEditor(item.id);
                                                else if (item.type === 'note') handleOpenNoteEditor(item.id);
                                                else handleOpenActivityEditor(item.id);
                                            }}
                                            className="whitespace-normal cursor-pointer hover:bg-black/10 rounded px-1 -mx-1 transition-colors"
                                        >
                                            {label}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-yellow-50/90 backdrop-blur-sm rounded p-0.5 z-10 shadow-sm border border-yellow-100">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleHideSharedNote(note.id); }}
                            className="p-1.5 text-slate-400 hover:text-yellow-700 hover:bg-yellow-100 rounded transition-colors"
                            title={note.isHidden ? "Zobrazit" : "Skrýt"}
                        >
                            {note.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSharedNote(note.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Smazat"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePinNote(note.id); }}
                            className={`p-1.5 hover:bg-yellow-100 rounded transition-colors ${note.isPinned ? 'text-yellow-700' : 'text-slate-400 hover:text-yellow-700'}`}
                            title={note.isPinned ? "Odepnout" : "Připnout"}
                        >
                            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            );
        };

        const renderProjectCard = (project) => {
            const sortProjectItems = (a, b) => {
                const isNoteA = a.type === 'note';
                const isNoteB = b.type === 'note';
                if (isNoteA && !isNoteB) return -1;
                if (!isNoteA && isNoteB) return 1;
                if (isNoteA && isNoteB) return (a.title || "").localeCompare(b.title || "");

                const dateA = a.start || "";
                const dateB = b.start || "";
                if (!dateA && dateB) return -1;
                if (dateA && !dateB) return 1;
                if (dateA && dateB) {
                    const dateComp = dateA.localeCompare(dateB);
                    if (dateComp !== 0) return dateComp;
                }
                return (a.title || "").localeCompare(b.title || "");
            };

            const renderItemTree = (item, level = 0) => {
                const isNote = item.type === 'note';
                let chipClass = "";
                let iconClass = "";

                if (isNote) {
                    chipClass = "bg-yellow-50 text-yellow-800 border-yellow-200";
                    iconClass = "text-yellow-600";
                } else if (item.type === 'project') {
                    chipClass = "bg-purple-50 text-purple-800 border-purple-200";
                    iconClass = "text-purple-600";
                } else {
                    chipClass = "bg-blue-50 text-blue-900 border-blue-200";
                    iconClass = "text-blue-700";
                }

                if (item.isSuppressed) {
                    chipClass = "bg-slate-100 text-slate-500 border-slate-300";
                    iconClass = "text-slate-400";
                }

                let dateLabel = "";
                if (!isNote && (item.start || item.end)) {
                    const fDate = (d) => d ? d.replace(/-/g, '.') : "";
                    if (item.start && item.end && item.start !== item.end) {
                        dateLabel = `${fDate(item.start)} - ${fDate(item.end)}`;
                    } else if (item.start) {
                        dateLabel = `${fDate(item.start)}`;
                    }
                }

                const labelText = item.title || "Bez názvu";
                const finalLabel = dateLabel ? `${dateLabel} - ${labelText}` : labelText;

                const internalSubs = item.subtasks || [];
                const linkedNotes = (item.linkedNoteIds || []).map(id => {
                    const n = sharedNotes[id];
                    return n ? { ...n, type: 'note', _isLinked: true } : null;
                }).filter(Boolean);
                const allChildren = [...internalSubs, ...linkedNotes].sort(sortProjectItems);

                return (
                    <div key={item.id} className="flex flex-col">
                        <div className="py-0.5 flex" style={{ paddingLeft: `${level * 24}px` }}>
                            <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border max-w-full ${chipClass}`}>
                                {isNote ? (
                                    <div className="w-3.5 h-3.5 shrink-0"></div>
                                ) : item.isSuppressed ? (
                                    <div className="w-4 h-4 shrink-0 -ml-0.5"></div>
                                ) : (
                                    <button
                                        onClick={(e) => handleToggleStatusWithUndo(e, item.id)}
                                        className={`w-4 h-4 flex items-center justify-center rounded-sm hover:bg-black/10 transition-colors shrink-0 -ml-0.5`}
                                    >
                                        {item.completed ?
                                            <Check className="w-3 h-3 text-green-600" strokeWidth={3} /> :
                                            <X className="w-3 h-3 text-red-500" strokeWidth={3} />
                                        }
                                    </button>
                                )}
                                <span className="w-px h-3 bg-current opacity-20 mx-0.5"></span>
                                {renderTypeIcon(isNote ? 'note' : (item.type || 'event'), `w-3 h-3 ${iconClass} shrink-0`)}
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (item.type === 'project') handleOpenProjectEditor(item.id);
                                        else if (item.type === 'note') handleOpenNoteEditor(item.id);
                                        else handleOpenActivityEditor(item.id);
                                    }}
                                    className={`whitespace-normal text-left break-words cursor-pointer hover:bg-black/10 rounded px-1 -mx-1 transition-colors`}
                                >
                                    {finalLabel}
                                </span>
                            </span>
                        </div>
                        {allChildren.length > 0 && <div>{allChildren.map(sub => renderItemTree(sub, level + 1))}</div>}
                    </div>
                );
            };

            const rootInternal = project.subtasks || [];
            const rootLinked = (project.linkedNoteIds || []).map(id => {
                const n = sharedNotes[id];
                return n ? { ...n, type: 'note', _isLinked: true } : null;
            }).filter(Boolean);
            const rootItems = [...rootInternal, ...rootLinked].sort(sortProjectItems);

            return (
                <div
                    key={project.id}
                    onClick={() => handleOpenProjectEditor(project.id)}
                    className={`bg-purple-50 border border-purple-200 p-4 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group relative flex flex-col mb-3 break-inside-avoid rounded-lg ${project.completed ? 'opacity-75' : ''}`}
                >
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 font-bold text-black">
                            <Folder className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className={`break-words ${project.completed ? 'line-through text-black/60' : ''}`}>{project.title}</span>
                        </div>
                        {project.isPinned && <Pin className="w-3.5 h-3.5 text-purple-600 fill-purple-200 shrink-0" />}
                    </div>

                    <div className="flex-1">
                        {rootItems.length > 0 ? <div>{rootItems.map(item => renderItemTree(item, 0))}</div> : (
                            <div className="text-center py-4"><span className="text-xs text-purple-300 italic">Prázdný projekt</span></div>
                        )}
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-purple-50/90 backdrop-blur-sm rounded p-0.5 z-10 shadow-sm border border-purple-100">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleHideEvent(e, project.id); }}
                            className="p-1.5 text-purple-400 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors"
                            title={project.isHidden ? "Zobrazit" : "Skrýt"}
                        >
                            {project.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-1.5 text-purple-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Smazat"><Trash2 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); togglePinProject(project.id); }} className={`p-1.5 hover:bg-purple-100 rounded transition-colors ${project.isPinned ? 'text-purple-700' : 'text-purple-400 hover:text-purple-700'}`} title={project.isPinned ? "Odepnout" : "Připnout"}>
                            <Pin className={`w-3.5 h-3.5 ${project.isPinned ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            );
        }

        let allNotes = Object.values(sharedNotes);
        if (viewSearchQuery) {
            const query = viewSearchQuery.toLowerCase();
            allNotes = allNotes.filter(n => n.title.toLowerCase().includes(query) || (n.content && n.content.toLowerCase().includes(query)));
        }
        const hiddenNotes = allNotes.filter(n => n.isHidden);
        const visibleNotes = allNotes.filter(n => !n.isHidden);
        const pinnedNotes = visibleNotes.filter(n => n.isPinned);
        const otherNotes = visibleNotes.filter(n => !n.isPinned);

        let allProjects = events.filter(e => e.type === 'project');
        if (viewSearchQuery) {
            const query = viewSearchQuery.toLowerCase();
            allProjects = allProjects.filter(p => p.title.toLowerCase().includes(query));
        }
        const hiddenProjects = allProjects.filter(p => p.isHidden);
        const visibleProjects = allProjects.filter(p => !p.isHidden);
        const pinnedProjects = visibleProjects.filter(p => p.isPinned);
        const otherProjects = visibleProjects.filter(p => !p.isPinned);

        return (
            <div className="max-w-5xl mx-auto pb-20">

                {/* --- SHARED NOTES DISPLAY --- */}
                {activeView === 'notes' && (
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Hledat poznámku (název nebo obsah)..." value={viewSearchQuery} onChange={(e) => setViewSearchQuery(e.target.value)} className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all text-sm shadow-sm" />
                                {viewSearchQuery && <button onClick={() => setViewSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                            </div>
                            <button onClick={handleCreateNewNote} className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg shadow-sm transition-colors text-sm shrink-0"><Plus className="w-4 h-4" /> Nový poznámka</button>
                        </div>

                        {pinnedNotes.length > 0 && (
                            <>
                                {renderSectionHeader("Připnuté poznámky", pinnedNotes.length, null, <Pin className="w-4 h-4 text-blue-500 fill-blue-100" />)}
                                <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3 mb-6">{pinnedNotes.map(renderNoteCard)}</div>
                            </>
                        )}

                        {(pinnedNotes.length > 0 && otherNotes.length > 0) && renderSectionHeader("Ostatní poznámky", otherNotes.length, null, <MoreHorizontal className="w-4 h-4 text-slate-400" />)}
                        {otherNotes.length > 0 && <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3">{otherNotes.map(renderNoteCard)}</div>}

                        <>
                            {renderSectionHeader("Skryté poznámky", hiddenNotes.length, 'notesHidden', <EyeOff className="w-4 h-4" />)}
                            {!sectionState.notesHidden && (
                                <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3 mb-6">
                                    {hiddenNotes.length > 0 ? hiddenNotes.map(renderNoteCard) : <div className="text-center py-8 text-slate-400 italic">Žádné skryté poznámky.</div>}
                                </div>
                            )}
                        </>
                        {allNotes.length === 0 && <div className="text-center py-10 text-slate-400 italic">{viewSearchQuery ? "Žádné poznámky neodpovídají hledání." : "Zatím zde nejsou žádné poznámky."}</div>}
                        {sortedEvents.length > 0 && <div className="h-px bg-slate-200 my-6"></div>}
                    </div>
                )}

                {/* --- PROJECTS DISPLAY --- */}
                {activeView === 'projects' && (
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                                <input type="text" placeholder="Hledat projekt..." value={viewSearchQuery} onChange={(e) => setViewSearchQuery(e.target.value)} className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-sm shadow-sm" />
                                {viewSearchQuery && <button onClick={() => setViewSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                            </div>
                            <button onClick={handleCreateNewProject} className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm shrink-0"><Plus className="w-4 h-4" /> Nový projekt</button>
                        </div>

                        {pinnedProjects.length > 0 && (
                            <>
                                {renderSectionHeader("Připnuté projekty", pinnedProjects.length, null, <Pin className="w-4 h-4 text-blue-500 fill-blue-100" />)}
                                <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3 mb-6">{pinnedProjects.map(renderProjectCard)}</div>
                            </>
                        )}

                        {(pinnedProjects.length > 0 && otherProjects.length > 0) && renderSectionHeader("Ostatní projekty", otherProjects.length, null, <MoreHorizontal className="w-4 h-4 text-slate-400" />)}
                        {otherProjects.length > 0 && <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3">{otherProjects.map(renderProjectCard)}</div>}

                        <>
                            {renderSectionHeader("Skryté projekty", hiddenProjects.length, 'projectsHidden', <EyeOff className="w-4 h-4" />)}
                            {!sectionState.projectsHidden && (
                                <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3 mb-6">
                                    {hiddenProjects.length > 0 ? hiddenProjects.map(renderProjectCard) : <div className="text-center py-8 text-slate-400 italic">Žádné skryté projekty.</div>}
                                </div>
                            )}
                        </>
                        {allProjects.length === 0 && <div className="text-center py-10 text-slate-400 italic">{viewSearchQuery ? "Žádné projekty neodpovídají hledání." : "Žádné projekty. Vytvořte nový v kalendáři nebo přepnutím typu."}</div>}
                    </div>
                )}

                <div className="space-y-1.5">
                    {sortedEvents.length === 0 && activeView === 'list' && <div className="text-center py-10 text-slate-400 italic col-span-full">"Žádné úkoly k zobrazení."</div>}
                    {activeView === 'notes' && sortedEvents.length > 0 && <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2"><List className="w-4 h-4" /> Rychlé poznámky v seznamu</h3>}

                    {activeView === 'list'
                        ? (
                            null
                        )
                        : (activeView !== 'projects' && sortedEvents.map((ev) => (
                            <RecursiveItem
                                key={ev.id} item={ev} level={0} parentId={null} activeView={activeView}
                                expandedIds={expandedIds} setExpandedIds={setExpandedIds} editingId={editingId} setEditingId={setEditingId}
                                draggingId={draggingId} justDroppedId={justDroppedId} allEvents={events} findItemAndParent={findItemAndParent}
                                originalEvents={originalEvents} setOriginalEvents={setOriginalEvents} openTypeDropdownId={openTypeDropdownId} setOpenTypeDropdownId={setOpenTypeDropdownId}
                                open ActionMenuId={openActionMenuId} setOpenActionMenuId={setOpenActionMenuId} sortConfig={sortConfig} updateEventField={updateEventField} toggleComplete={toggleComplete} indentItem={indentItem}
                                outdentItem={outdentItem} addSubtask={addSubtask} duplicateEvent={duplicateEvent} deleteEvent={deleteEvent} updateTree={updateTree}
                                handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit} handleRequestEdit={handleRequestEdit} onDragStart={onDragStart} onDragEnd={onDragEnd}
                                onMoveBefore={onMoveBefore} onMoveAfter={onMoveAfter} onMoveAsChild={onMoveAsChild} onMoveAsParent={onMoveAsParent} getSortedItems={getSortedItems} getDayName={getDayName} getTodayStr={getTodayStr}
                                sharedNotes={sharedNotes} onOpenNotePicker={handleOpenNotePicker} onOpenNoteEditor={handleOpenNoteEditor} onUnlinkNote={handleUnlinkNote}
                            />
                        )))}
                </div>
            </div>
        );
    };

    const renderCalendar = () => {
        const days = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date(startDate); d.setDate(startDate.getDate() + i);
            const dStr = getDateStr(d);
            const dayItems = events.filter(e => e.start === dStr || e.end === dStr || (e.start < dStr && e.end > dStr));
            days.push(
                <div key={dStr} className="flex gap-4 py-4 border-b border-slate-100 group">
                    <div className="w-16 text-right shrink-0 pt-1">
                        <div className={`font-bold text-lg ${i === 0 ? 'text-blue-600' : 'text-slate-700'}`}>{d.getDate()}.{d.getMonth() + 1}.</div>
                        <div className="text-xs text-slate-400 uppercase">{DAY_NAMES_SHORT[d.getDay()]}</div>
                    </div>
                    <div className="flex-1 space-y-1">
                        {dayItems.length === 0 && addingToDate !== dStr && (
                            <div onClick={() => setAddingToDate(dStr)} className="h-6 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-300 text-sm flex items-center hover:text-blue-500 transition-all"><Plus className="w-4 h-4 mr-1" /> Přidat</div>
                        )}
                        {dayItems.map(ev => (
                            <div key={ev.id} className={`p-2 text-sm border flex items-center justify-between ${ev.completed ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <span className="font-medium truncate">{ev.title}</span>
                                <span className="text-xs text-slate-400 ml-2">{ev.startTime}</span>
                            </div>
                        ))}
                        {addingToDate === dStr && (
                            <div className="flex gap-2 animate-in fade-in">
                                <input autoFocus className="flex-1 bg-slate-50 border px-2 py-1 text-sm" placeholder="Co se děje?" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddEvent(dStr)} />
                                <button onClick={() => handleAddEvent(dStr)} className="bg-blue-600 text-white px-2"><Check className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return <div className="max-w-2xl mx-auto">{days}</div>;
    };

    const renderSettingsView = () => (
        <div className="max-w-2xl mx-auto py-8 px-4 text-slate-700">
            <div className="flex items-center gap-3 mb-8 border-b pb-4">
                <Settings className="w-8 h-8 text-slate-700" />
                <h1 className="text-2xl font-bold text-slate-800">Nastavení aplikace</h1>
            </div>

            <div className="space-y-10">
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-600" />Zobrazení</h2>
                    <div className="bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${showStats ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>{showStats ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}</div>
                                <div>
                                    <p className="font-medium text-slate-900">Statistiky v menu</p>
                                    <p className="text-sm text-slate-500">Zobrazit počty úkolů a poznámek nad tlačítky hlavního menu.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowStats(!showStats)} className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${showStats ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-300 ${showStats ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ArrowUpDown className="w-5 h-5 text-teal-600" />Řazení záznamů (Aktivity)</h2>
                    <div className="bg-white p-6 shadow-sm border border-slate-200 space-y-8">
                        <p className="text-sm text-slate-500 mb-2">Nastavte si detailně, jak se mají řadit záznamy v jednotlivých sekcích. Vždy můžete zvolit pořadí kategorií a poté řazení uvnitř nich.</p>

                        <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2 mb-4">
                                <List className="w-4 h-4 text-slate-400" />
                                <h3 className="font-bold text-sm uppercase text-slate-700">Aktivity bez termínu</h3>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pořadí kategorií</label>
                                    <CustomSortSelect
                                        value={listSortSettings.noDate.group}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, noDate: { ...prev.noDate, group: val } }))}
                                        options={GROUP_ORDER_OPTIONS}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Řazení aktivit</label>
                                    <CustomSortSelect
                                        value={listSortSettings.noDate.actSort}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, noDate: { ...prev.noDate, actSort: val } }))}
                                        options={INTERNAL_SORT_OPTIONS}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Řazení poznámek</label>
                                    <CustomSortSelect
                                        value={listSortSettings.noDate.noteSort}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, noDate: { ...prev.noDate, noteSort: val } }))}
                                        options={INTERNAL_SORT_OPTIONS}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2 mb-4">
                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                <h3 className="font-bold text-sm uppercase text-slate-700">Aktivity s termínem</h3>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pořadí kategorií</label>
                                    <CustomSortSelect
                                        value={listSortSettings.withDate.group}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, withDate: { ...prev.withDate, group: val } }))}
                                        options={GROUP_ORDER_OPTIONS}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Řazení aktivit</label>
                                    <CustomSortSelect
                                        value={listSortSettings.withDate.actSort}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, withDate: { ...prev.withDate, actSort: val } }))}
                                        options={INTERNAL_SORT_OPTIONS}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Řazení poznámek</label>
                                    <CustomSortSelect
                                        value={listSortSettings.withDate.noteSort}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, withDate: { ...prev.withDate, noteSort: val } }))}
                                        options={INTERNAL_SORT_OPTIONS}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <EyeOff className="w-4 h-4 text-slate-400" />
                                <h3 className="font-bold text-sm uppercase text-slate-700">Skryté aktivity</h3>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pořadí kategorií</label>
                                    <CustomSortSelect
                                        value={listSortSettings.hidden.group}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, hidden: { ...prev.hidden, group: val } }))}
                                        options={GROUP_ORDER_OPTIONS}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Řazení aktivit</label>
                                    <CustomSortSelect
                                        value={listSortSettings.hidden.actSort}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, hidden: { ...prev.hidden, actSort: val } }))}
                                        options={INTERNAL_SORT_OPTIONS}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Řazení poznámek</label>
                                    <CustomSortSelect
                                        value={listSortSettings.hidden.noteSort}
                                        onChange={(val) => setListSortSettings(prev => ({ ...prev, hidden: { ...prev.hidden, noteSort: val } }))}
                                        options={INTERNAL_SORT_OPTIONS}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-purple-600" />Data aplikace</h2>
                    <div className="space-y-6">
                        <div className="bg-white p-6 shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Download className="w-5 h-5 text-blue-500" />Export dat</h3>
                            <p className="text-sm text-slate-600 mb-4">Stáhněte si všechna svá data do CSV souboru.</p>
                            <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"><FileDown className="w-4 h-4" />Stáhnout data (.csv)</button>
                        </div>
                        <div className="bg-white p-6 shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-green-600" />Import dat</h3>
                            <p className="text-sm text-slate-600 mb-2">Nahrajte dříve stažený CSV soubor. <strong className="text-red-600">Pozor: Toto přepíše záznamy!</strong></p>
                            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                                <div className="flex flex-col items-center"><FileUp className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" /><span className="text-sm text-slate-500 group-hover:text-blue-600 font-medium">Klikněte pro výběr CSV souboru</span></div>
                                <input type="file" accept=".csv" onChange={importFromCSV} className="hidden" />
                            </label>
                        </div>
                        <div className="bg-red-50 p-6 border border-red-200">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-700"><ShieldAlert className="w-5 h-5" />Nebezpečná zóna</h3>
                            {deleteConfirmationLevel === 0 && (
                                <button onClick={handleDeleteAll} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 font-medium hover:bg-red-600 hover:text-white transition-colors shadow-sm"><Trash2 className="w-4 h-4" />Smazat všechna data</button>
                            )}
                            {deleteConfirmationLevel > 0 && (
                                <div className="animate-in fade-in slide-in-from-left-2">
                                    <p className="font-bold text-red-800 mb-2">{deleteConfirmationLevel === 3 ? "POSLEDNÍ VAROVÁNÍ" : `Opravdu chcete pokračovat? (Krok ${deleteConfirmationLevel}/3)`}</p>
                                    <div className="flex gap-2">
                                        <button onClick={handleDeleteAll} className={`px-3 py-1 text-white text-sm font-bold shadow-sm ${deleteConfirmationLevel === 3 ? 'bg-red-900 hover:bg-black' : 'bg-red-600 hover:bg-red-700'}`}>{deleteConfirmationLevel === 3 ? "POTVRDIT A SMAZAT VŠE" : "Ano, pokračovat"}</button>
                                        <button onClick={() => setDeleteConfirmationLevel(0)} className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-sm hover:bg-slate-50">Zrušit</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );

    const renderHelpUser = () => (
        <div className="max-w-4xl mx-auto py-8 px-4 text-slate-700">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <HelpCircle className="w-8 h-8 text-green-600" />
                <h1 className="text-2xl font-bold text-slate-800">Nápověda pro uživatele</h1>
            </div>
            <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg mb-6">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-slate-800"><RotateCw className="w-6 h-6 text-blue-600" /> Opakované aktivity a podúkoly</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    Pokud vytvoříte aktivitu jako <strong>opakující se</strong>, aplikace vám automaticky vygeneruje seznam "výskytů" (podúkolů) pro každý den, který odpovídá vašemu nastavení.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                    <li>Tyto podúkoly se nezobrazují přímo na hlavní kartě, aby nezabíraly místo.</li>
                    <li>Najdete je v editoru aktivity pod tlačítkem <strong>ZOBRAZIT GENEROVANÉ PODÚKOLY</strong>.</li>
                    <li>V otevřeném okně můžete jednotlivé dny odškrtávat jako splněné.</li>
                    <li>Pokud změníte nastavení opakování (např. z týdenního na denní), seznam se přegeneruje (pozor, ztratíte tím stav splnění u původních dnů).</li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8faff] py-8 px-4 font-sans text-slate-800">
            <div className="max-w-5xl mx-auto relative">
                <div className="mb-6 flex justify-center md:justify-end">
                    <div className="bg-white p-1 shadow-sm border border-slate-200 flex flex-wrap gap-2 md:gap-0 items-end justify-end">
                        <div className="flex flex-col items-center">
                            <button onClick={() => handleViewSwitch('overview')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all ${activeView === 'overview' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarIcon className="w-4 h-4" /> Kalendář</button>
                        </div>
                        <div className="w-px bg-slate-200 mx-1 h-6 hidden md:block"></div>
                        <div className="flex flex-col items-center gap-1">
                            {showStats && <span className="text-[10px] font-bold text-indigo-500 animate-in fade-in slide-in-from-bottom-1">{stats.projects}</span>}
                            <button onClick={() => handleViewSwitch('projects')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all ${activeView === 'projects' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Folder className="w-4 h-4" /> Projekty</button>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            {showStats && <span className="text-[10px] font-bold text-blue-500 animate-in fade-in slide-in-from-bottom-1">{stats.others}</span>}
                            <button onClick={() => handleViewSwitch('list')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all ${activeView === 'list' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarIcon className="w-4 h-4" /> Aktivity</button>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            {showStats && <span className="text-[10px] font-bold text-yellow-500 animate-in fade-in slide-in-from-bottom-1">{stats.notes}</span>}
                            <button onClick={() => handleViewSwitch('notes')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all ${activeView === 'notes' ? 'bg-yellow-50 text-yellow-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><StickyNote className="w-4 h-4" /> Poznámky</button>
                        </div>
                        <div className="w-px bg-slate-200 mx-1 h-6 hidden md:block"></div>
                        <div className="flex flex-col items-center gap-1">
                            {showStats && <span className="text-[10px] font-bold text-slate-400 animate-in fade-in slide-in-from-bottom-1">Celkem {stats.total}</span>}
                            <div className="flex">
                                <button onClick={() => handleViewSwitch('settings')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all ${activeView === 'settings' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Settings className="w-4 h-4" /> Nastavení</button>
                                <button onClick={() => handleViewSwitch('help_user')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-all ${activeView === 'help_user' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><HelpCircle className="w-4 h-4" /> Nápověda</button>
                            </div>
                        </div>
                    </div>
                </div>

                {activeView === 'overview' && renderCalendar()}
                {(activeView === 'list' || activeView === 'notes' || activeView === 'projects') && renderList()}
                {activeView === 'settings' && renderSettingsView()}
                {activeView === 'help_user' && renderHelpUser()}

                {undoData && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5">
                        <div className="bg-slate-800 text-white border border-slate-700 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-4">
                            <span className="text-sm font-medium">{undoData.message}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleUndo(); }} className="text-blue-400 font-bold text-sm ml-2">Vrátit</button>
                            <button onClick={() => setUndoData(null)} className="text-slate-500"><X className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}

                {warningMsg && (
                    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-5 w-auto max-w-[90%] md:max-w-none">
                        <div className="bg-slate-800 text-white border border-slate-700 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
                            <Info className="w-5 h-5 text-blue-400 shrink-0" />
                            <span className="text-sm font-medium">
                                {typeof warningMsg === 'string' ? warningMsg : warningMsg.text}
                            </span>
                            {typeof warningMsg === 'object' && warningMsg.action && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); warningMsg.action(); }}
                                    className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors shadow-sm"
                                >
                                    Ano
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {isNotePickerOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
                            <div className="bg-slate-50 p-3 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">Vyberte poznámku</h3><button onClick={() => setIsNotePickerOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
                            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                                <button onClick={handleCreateAndLinkNote} className="w-full text-left p-3 hover:bg-blue-50 rounded border border-dashed border-blue-200 text-blue-600 font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Vytvořit novou poznámku</button>
                                {Object.values(sharedNotes).map(note => (
                                    <button key={note.id} onClick={() => handleLinkNote(note.id)} className="w-full text-left p-3 hover:bg-slate-50 rounded border border-slate-100 text-slate-700 flex items-center gap-3 group">
                                        <StickyNote className="w-4 h-4 text-yellow-500" /><span className="font-medium truncate flex-1">{note.title}</span><Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* EDITOR POZNÁMKY (Obnovený) */}
                {isNoteEditorOpen && activeNoteId && (() => {
                    const noteLinksArr = Array.from(tempNoteLinks).map(id => {
                        const found = findItemAndParent(events, id);
                        if (!found || !found.item) return null;
                        return {
                            ...found.item,
                            title: getDisplayTitle(found.item, found.parent),
                            type: found.item.type || (found.parent ? found.parent.type : 'event'),
                            isSuppressed: found.item.isSuppressed || false
                        };
                    }).filter(Boolean);

                    const searchResults = getAllTasksFlat(events).filter(e => e.title && e.title.toLowerCase().includes(linkSearchQuery.toLowerCase()) && e.type !== 'note');

                    const originalNote = sharedNotes[activeNoteId];
                    const hasNoteChanges = originalNote ? (
                        activeNoteTitle !== (originalNote.title || "") ||
                        activeNoteContent !== (originalNote.content || "") ||
                        activeNoteType !== (originalNote.type || "text") ||
                        !areSetsEqual(tempNoteLinks, originalNoteLinks) ||
                        Object.keys(tempStatusChanges).length > 0
                    ) : false;

                    return (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" style={{ zIndex: editorZIndices.note }}>
                            <div ref={noteEditorRef} className="bg-yellow-50 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] h-auto border border-yellow-200 relative transition-all duration-300">
                                <div className="bg-transparent px-4 py-3 border-b border-yellow-200 flex items-center gap-3 shrink-0">
                                    <StickyNote className="w-5 h-5 text-yellow-600 shrink-0" />
                                    <div className="flex-1">
                                        <select value={activeNoteType} onChange={(e) => setActiveNoteType(e.target.value)} className="bg-transparent text-sm font-bold text-yellow-900 focus:outline-none cursor-pointer">
                                            <option value="text">Standardní poznámka</option>
                                            <option value="heading">Nadpis (bez obsahu)</option>
                                        </select>
                                    </div>
                                    <div className="w-9 h-9 flex items-center justify-center shrink-0">
                                        {hasNoteChanges && (
                                            <button onClick={handleSaveNoteContent} className="w-full h-full bg-white border border-yellow-200 hover:bg-yellow-100 text-yellow-700 rounded-full transition-colors shadow-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"><Save className="w-5 h-5" /></button>
                                        )}
                                    </div>
                                    <button onClick={() => setIsNoteEditorOpen(false)} className="w-9 h-9 flex items-center justify-center bg-white/50 hover:bg-red-100 text-yellow-700 hover:text-red-600 rounded-full transition-colors shrink-0"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="bg-transparent px-4 pt-4 pb-4 shrink-0 border-b border-yellow-200 flex items-start gap-3">
                                    <textarea ref={noteTitleRef} rows={1} value={activeNoteTitle} onChange={(e) => setActiveNoteTitle(e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight + 2) + 'px'; }} className="font-bold text-xl bg-transparent border-transparent focus:border-yellow-300 rounded px-2 py-1 focus:outline-none w-full text-yellow-900 placeholder:text-yellow-700/50 resize-none overflow-hidden" placeholder="Název poznámky..." style={{ minHeight: '2.5rem' }} />
                                </div>

                                {activeNoteType !== 'heading' && (
                                    <div className="flex-1 overflow-y-auto p-4 bg-white/50 min-h-[200px]">
                                        <textarea value={activeNoteContent} onChange={(e) => setActiveNoteContent(e.target.value)} className="w-full h-full min-h-[150px] bg-transparent border-none focus:outline-none text-slate-800 placeholder:text-slate-400 resize-none" placeholder="Sem napište text poznámky..." />
                                    </div>
                                )}

                                <div className="bg-yellow-100/50 p-3 border-t border-yellow-200 flex flex-col gap-2 shrink-0">
                                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                                        {noteLinksArr.map((item) => {
                                            let chipClass = item.type === 'project' ? 'bg-purple-50 text-purple-900 border-purple-200' : 'bg-blue-50 text-blue-900 border-blue-200';
                                            let iconClass = item.type === 'project' ? 'text-purple-600' : 'text-blue-600';

                                            if (item.isSuppressed) {
                                                chipClass = 'bg-slate-100 text-slate-500 border-slate-300';
                                                iconClass = 'text-slate-400';
                                            }

                                            return (
                                                <span key={item.id} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border h-auto ${chipClass}`}>
                                                    {renderTypeIcon(item.type, `w-3 h-3 ${iconClass} shrink-0`)}
                                                    <span className="font-medium whitespace-normal break-words">{item.title}</span>
                                                    <button onClick={() => handleInlineTaskToggle(item.id, false)} className="ml-1 hover:bg-black/10 rounded p-0.5"><X className="w-3 h-3 opacity-60 hover:opacity-100" /></button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <div className="relative" ref={linkDropdownRef}>
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 text-yellow-600/50 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input type="text" placeholder="Připojit k aktivitě nebo projektu..." value={linkSearchQuery} onFocus={() => setIsLinkDropdownOpen(true)} onChange={(e) => { setLinkSearchQuery(e.target.value); setIsLinkDropdownOpen(true); }} className="w-full bg-white border border-yellow-300 pl-9 pr-8 py-2 text-sm text-yellow-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 shadow-sm transition-all" />
                                        </div>
                                        {isLinkDropdownOpen && (
                                            <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-yellow-300 rounded-lg max-h-60 flex flex-col shadow-xl z-50 overflow-hidden">
                                                <div className="overflow-y-auto p-1">
                                                    {searchResults.map(item => {
                                                        const isLinked = tempNoteLinks.has(item.id);
                                                        return (
                                                            <button key={item.id} onClick={() => handleInlineTaskToggle(item.id, !isLinked)} className="w-full text-left py-1.5 px-2 border-b last:border-0 flex items-start gap-2 hover:bg-yellow-50 group rounded">
                                                                <div className={`w-4 h-4 flex items-center justify-center rounded border transition-colors shrink-0 mt-0.5 ${isLinked ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}><Check className="w-3 h-3" /></div>
                                                                <span className="flex-1 text-xs text-yellow-900 font-medium">{item.title}</span>
                                                            </button>
                                                        )
                                                    })}
                                                    {searchResults.length === 0 && <div className="p-4 text-center text-xs text-yellow-700/50 italic">Žádné výsledky...</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* EDITOR PROJEKTU (Obnovený) */}
                {isProjectEditorOpen && activeProjectId && (() => {
                    const projectNoteLinksArr = Array.from(tempProjectLinks).map(id => sharedNotes[id]).filter(Boolean);
                    const searchResults = Object.values(sharedNotes).filter(n => n.title.toLowerCase().includes(linkSearchQuery.toLowerCase()));

                    const foundObj = findItemAndParent(events, activeProjectId);
                    const originalProject = foundObj ? foundObj.item : null;
                    const originalProjectLinks = new Set(originalProject ? (originalProject.linkedNoteIds || []) : []);

                    const hasProjectChanges = originalProject ? (
                        activeProjectTitle !== (originalProject.title || "") ||
                        activeProjectCompleted !== (originalProject.completed || false) ||
                        !areSetsEqual(tempProjectLinks, originalProjectLinks) ||
                        Object.keys(tempStatusChanges).length > 0
                    ) : false;

                    return (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" style={{ zIndex: editorZIndices.project }}>
                            <div ref={projectEditorRef} className="bg-purple-50 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] h-auto border border-purple-200 relative transition-all duration-300">
                                <div className="bg-transparent px-4 py-3 border-b border-purple-200 flex items-center gap-3 shrink-0">
                                    <Folder className="w-5 h-5 text-purple-600 shrink-0" />
                                    <div className="flex-1 font-bold text-purple-900 text-sm">Editor projektu</div>
                                    <div className="w-9 h-9 flex items-center justify-center shrink-0">
                                        {hasProjectChanges && (
                                            <button onClick={handleSaveProject} className="w-full h-full bg-white border border-purple-200 hover:bg-purple-100 text-purple-700 rounded-full transition-colors shadow-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"><Save className="w-5 h-5" /></button>
                                        )}
                                    </div>
                                    <button onClick={() => setIsProjectEditorOpen(false)} className="w-9 h-9 flex items-center justify-center bg-white/50 hover:bg-red-100 text-purple-700 hover:text-red-600 rounded-full transition-colors shrink-0"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="bg-transparent px-4 pt-4 pb-4 shrink-0 border-b border-purple-200 flex items-start gap-3">
                                    <button onClick={() => setActiveProjectCompleted(!activeProjectCompleted)} className="mt-1 w-9 h-9 bg-white border border-purple-200 rounded-lg flex items-center justify-center transition-colors shrink-0 hover:bg-purple-50">
                                        {activeProjectCompleted ? <Check className="w-6 h-6 text-green-600" strokeWidth={3} /> : <X className="w-6 h-6 text-red-500" strokeWidth={3} />}
                                    </button>
                                    <textarea ref={projectTitleRef} rows={1} value={activeProjectTitle} onChange={(e) => setActiveProjectTitle(e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight + 2) + 'px'; }} className="font-bold text-xl bg-transparent border-transparent focus:border-purple-300 rounded px-2 py-1 focus:outline-none w-full text-purple-900 placeholder:text-purple-700/50 resize-none overflow-hidden" placeholder="Název projektu..." style={{ minHeight: '2.5rem' }} />
                                </div>

                                <div className="bg-purple-100/30 p-3 border-t border-purple-200 flex flex-col gap-2 shrink-0">
                                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                                        {projectNoteLinksArr.map((item) => (
                                            <span key={item.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border h-auto bg-yellow-50 text-yellow-900 border-yellow-200">
                                                <StickyNote className="w-3 h-3 text-yellow-600 shrink-0" />
                                                <span className="font-medium whitespace-normal break-words">{item.title}</span>
                                                <button onClick={() => handleInlineNoteToggleForProject(item.id, false)} className="ml-1 hover:bg-black/10 rounded p-0.5"><X className="w-3 h-3 opacity-60 hover:opacity-100" /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative" ref={projectLinkDropdownRef}>
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 text-purple-600/50 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input type="text" placeholder="Připojit poznámku..." value={linkSearchQuery} onFocus={() => setIsLinkDropdownOpen(true)} onChange={(e) => { setLinkSearchQuery(e.target.value); setIsLinkDropdownOpen(true); }} className="w-full bg-white border border-purple-300 pl-9 pr-8 py-2 text-sm text-purple-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 shadow-sm transition-all" />
                                        </div>
                                        {isLinkDropdownOpen && (
                                            <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-purple-300 rounded-lg max-h-60 flex flex-col shadow-xl z-50 overflow-hidden">
                                                <div className="overflow-y-auto p-1">
                                                    {searchResults.map(item => {
                                                        const isLinked = tempProjectLinks.has(item.id);
                                                        return (
                                                            <button key={item.id} onClick={() => handleInlineNoteToggleForProject(item.id, !isLinked)} className="w-full text-left py-1.5 px-2 border-b last:border-0 flex items-start gap-2 hover:bg-purple-50 group rounded">
                                                                <div className={`w-4 h-4 flex items-center justify-center rounded border transition-colors shrink-0 mt-0.5 ${isLinked ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}><Check className="w-3 h-3" /></div>
                                                                <StickyNote className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" />
                                                                <span className="flex-1 text-xs text-purple-900 font-medium">{item.title}</span>
                                                            </button>
                                                        )
                                                    })}
                                                    {searchResults.length === 0 && <div className="p-4 text-center text-xs text-purple-700/50 italic">Žádné výsledky...</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {isActivityEditorOpen && (() => {
                    const noteResults = Object.values(sharedNotes).filter(n => n.title.toLowerCase().includes(linkSearchQuery.toLowerCase())).map(n => ({ ...n, _type: 'note' }));
                    const projectResults = events.filter(e => e.type === 'project' && e.title.toLowerCase().includes(linkSearchQuery.toLowerCase())).map(p => ({ ...p, _type: 'project' }));
                    const searchResults = [...noteResults, ...projectResults];

                    const allAttachments = Array.from(tempActivityLinks).map(id => {
                        const note = sharedNotes[id];
                        if (note) return { ...note, _type: 'note' };
                        const project = events.find(e => e.id === id && e.type === 'project');
                        if (project) return { ...project, _type: 'project' };
                        return null;
                    }).filter(Boolean);

                    const foundObj = findItemAndParent(events, activeActivityId);
                    const originalActivity = foundObj ? foundObj.item : null;
                    const originalLinks = new Set(originalActivity ? (originalActivity.linkedNoteIds || []) : []);

                    const originalInstancesStr = JSON.stringify(originalActivity ? (originalActivity.recurrenceInstances || []) : []);
                    const currentInstancesStr = JSON.stringify(currentRecurrenceInstances);
                    const instancesChanged = originalInstancesStr !== currentInstancesStr;

                    const isNewActivity = !originalActivity;

                    const baseChanges = isNewActivity ? false : (
                        activeActivityTitle !== (originalActivity.title || "") ||
                        activeActivityStart !== (originalActivity.start || "") ||
                        activeActivityEnd !== (originalActivity.end || "") ||
                        activeActivityStartTime !== (originalActivity.startTime || "") ||
                        activeActivityEndTime !== (originalActivity.endTime || "") ||
                        activeActivityCompleted !== (originalActivity.completed || false) ||
                        activeActivityType !== (originalActivity.activityType || 'single') ||
                        !areSetsEqual(tempActivityLinks, originalLinks) ||
                        Object.keys(tempStatusChanges).length > 0
                    );

                    const recurringChanges = (activeActivityType === 'recurring' || activeActivityType === 'multi_recurring') && !isNewActivity ? (
                        activeActivityIntervalStart !== (originalActivity.intervalStart || "") ||
                        activeActivityIntervalEnd !== (originalActivity.intervalEnd || "") ||
                        activeActivityRecurrencePattern !== (originalActivity.recurrencePattern || 'daily') ||
                        activeActivityRecurrenceInterval !== (originalActivity.recurrenceInterval || 1) ||
                        activeActivityRecurrenceUnit !== (originalActivity.recurrenceUnit || 'day') ||
                        !areSetsEqual(new Set(activeActivityRecurrenceDays), new Set(originalActivity.recurrenceDays || [])) ||
                        !areSetsEqual(new Set(activeActivityRecurrenceWeeks), new Set(originalActivity.recurrenceWeeks || ['odd', 'even'])) ||
                        instancesChanged ||
                        JSON.stringify(activeActivityMultiDefs) !== JSON.stringify(originalActivity.multiDefs || [])
                    ) : false;

                    const hasChanges = isNewActivity ?
                        (activeActivityTitle.length > 0 || instancesChanged || (activeActivityType === 'multi_recurring' && (!!activeActivityIntervalStart || !!activeActivityIntervalEnd || activeActivityMultiDefs.some(d => !!d.title || !!d.startTime || !!d.endTime))))
                        : (baseChanges || recurringChanges);

                    const isRecurring = activeActivityType === 'recurring';
                    const isMultiRecurring = activeActivityType === 'multi_recurring';

                    const formatDateCZ = (dateStr) => {
                        if (!dateStr) return "";
                        const [y, m, d] = dateStr.split('-');
                        return `${d}.${m}.${y}`;
                    }

                    const sortedInstancesForEditor = [...currentRecurrenceInstances].sort((a, b) => {
                        const dateA = a.date || "";
                        const dateB = b.date || "";
                        if (dateA !== dateB) return dateA.localeCompare(dateB);
                        return (a.startTime || "").localeCompare(b.startTime || "");
                    });

                    const sourceTotalsEditor = {};
                    sortedInstancesForEditor.forEach(i => {
                        if (!i.isSuppressed) {
                            const sIdx = i._sourceIdx || 0;
                            sourceTotalsEditor[sIdx] = (sourceTotalsEditor[sIdx] || 0) + 1;
                        }
                    });

                    const sourceCurrentsEditor = {};

                    return (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" style={{ zIndex: editorZIndices.activity }}>
                            <div ref={activityEditorRef} className="bg-blue-50 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] h-auto border border-blue-200 relative transition-all duration-300">
                                <div className="bg-transparent px-4 py-3 border-b border-blue-200 flex items-center gap-3 shrink-0">
                                    <CalendarIcon className="w-5 h-5 text-blue-600 shrink-0" />
                                    <div className="relative group flex-1">
                                        <select
                                            value={activeActivityType}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveActivityType(val);
                                                if (val === 'multi_recurring' && activeActivityMultiDefs.length === 0) {
                                                    setActiveActivityMultiDefs([{ startTime: "", endTime: "", title: "" }]);
                                                }
                                            }}
                                            className="w-full appearance-none bg-white border border-blue-300 pl-4 pr-10 py-2 text-sm font-bold text-blue-900 tracking-wide hover:border-blue-400 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                                        >
                                            <option value="single">● Jednorázová aktivita</option>
                                            <option value="recurring">↻ Opakující se aktivita V1</option>
                                            <option value="multi_recurring">☰ Skupina více opakujících se aktivit</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-blue-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>

                                    <div className="w-9 h-9 flex items-center justify-center shrink-0">
                                        {hasChanges && (
                                            <button onClick={handleSaveActivity} className="w-full h-full bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 rounded-full transition-colors shadow-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"><Save className="w-5 h-5" /></button>
                                        )}
                                    </div>
                                    <button onClick={() => setIsActivityEditorOpen(false)} className="w-9 h-9 flex items-center justify-center bg-white/50 hover:bg-red-100 text-blue-700 hover:text-red-600 rounded-full transition-colors shrink-0"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="bg-transparent px-4 pt-4 pb-4 shrink-0 border-b border-blue-200 flex items-start gap-3">
                                    {!isRecurring && !isMultiRecurring && (
                                        <button
                                            onClick={() => setActiveActivityCompleted(!activeActivityCompleted)}
                                            className={`mt-1 w-9 h-9 bg-white border border-blue-200 rounded-lg flex items-center justify-center transition-colors shrink-0 hover:bg-blue-50`}
                                        >
                                            {activeActivityCompleted ?
                                                <Check className="w-6 h-6 text-green-600" strokeWidth={3} /> :
                                                <X className="w-3 h-3 text-red-500" strokeWidth={3} />
                                            }
                                        </button>
                                    )}
                                    <div className="flex-1 flex items-center gap-2">
                                        {isMultiRecurring ? (
                                            <div className="flex flex-col w-full gap-1">
                                                <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide pl-0.5">Název skupiny aktivit</label>
                                                <input
                                                    type="text"
                                                    value={activeActivityTitle}
                                                    onChange={(e) => setActiveActivityTitle(e.target.value)}
                                                    className={`font-bold text-sm border focus:border-blue-400 rounded px-3 py-1.5 focus:outline-none w-full text-slate-800 placeholder:text-slate-400 shadow-sm h-[34px] transition-colors ${!activeActivityTitle?.trim() ? 'bg-red-50 border-red-300' : 'bg-white border-blue-200'}`}
                                                    placeholder="Název skupiny aktivit..."
                                                />
                                            </div>
                                        ) : (
                                            <textarea
                                                ref={activityTitleRef}
                                                rows={1}
                                                value={activeActivityTitle}
                                                onChange={(e) => setActiveActivityTitle(e.target.value)}
                                                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight + 2) + 'px'; }}
                                                className="font-bold text-xl bg-white border border-transparent focus:border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-0 w-full text-slate-800 placeholder:text-slate-400 shadow-sm resize-none overflow-hidden"
                                                placeholder="Název aktivity..."
                                                style={{ minHeight: '2.5rem' }}
                                            />
                                        )}
                                        {isRecurring && (
                                            <div className="relative shrink-0" ref={nameHelpRef}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowNameHelp(!showNameHelp); }}
                                                    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                                    title="Nápověda ke kódům v názvu"
                                                >
                                                    <Info className="w-5 h-5" />
                                                </button>
                                                {showNameHelp && (
                                                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 text-white p-3 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 text-xs leading-relaxed border border-slate-700">
                                                        <div className="font-bold mb-2 text-blue-300 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                                                            <HelpCircle className="w-3.5 h-3.5" /> Automatické číslování
                                                        </div>
                                                        <p className="mb-2">V názvu můžete použít tyto kódy pro automatické doplnění čísel:</p>
                                                        <ul className="space-y-2">
                                                            <li>
                                                                <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">{"<d>"}</code>
                                                                <span className="ml-1">— Aktuální pořadové číslo dne (nezapočítává potlačené).</span>
                                                            </li>
                                                            <li>
                                                                <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">{"<s>"}</code>
                                                                <span className="ml-1">— Celkový počet naplánovaných dní (nezapočítává potlačené).</span>
                                                            </li>
                                                            <li>
                                                                <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">{"<n>"}</code>
                                                                <span className="ml-1">— Název skupiny / hlavní aktivity.</span>
                                                            </li>
                                                        </ul>
                                                        <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 italic">
                                                            Příklad: „{"<n>"} - Trénink {"<d>"} / {"<s>"}“ se zobrazí jako „Moje skupina - Trénink 1 / 10“.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {(isRecurring || isMultiRecurring) ? (
                                    <div className="animate-in fade-in slide-in-from-top-2 border-b border-blue-200 bg-blue-50/50 p-0 overflow-y-auto overflow-x-hidden w-full">
                                        <div className="flex flex-col md:flex-row w-full border-b border-blue-300">
                                            {!isMultiRecurring && (
                                                <div className="flex-1 flex flex-col items-center justify-center p-5 border-b border-blue-300 md:border-b-0 md:border-r">
                                                    <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-2 text-center">Čas začátku a konce</label>
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <input type="time" value={activeActivityStartTime} onChange={(e) => setActiveActivityStartTime(e.target.value)} className="bg-white border border-blue-200 rounded px-2 py-1 text-lg font-semibold focus:border-blue-400 focus:outline-none shadow-sm w-24 text-center" />
                                                        <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
                                                        <input type="time" value={activeActivityEndTime} onChange={(e) => setActiveActivityEndTime(e.target.value)} className="bg-white border border-blue-200 rounded px-2 py-1 text-lg font-semibold focus:border-blue-400 focus:outline-none shadow-sm w-24 text-center" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className={isMultiRecurring ? "flex flex-col items-start justify-start px-5 py-3 w-full" : "flex flex-col items-center justify-center p-5 flex-1"}>
                                                <label className={`block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-2 ${isMultiRecurring ? 'text-left' : 'text-center'}`}>Interval trvání opakující se aktivity</label>
                                                <div className={`flex items-center gap-2 w-full ${isMultiRecurring ? 'justify-start' : 'justify-center'}`}>
                                                    <input type="date" value={activeActivityIntervalStart} onChange={(e) => setActiveActivityIntervalStart(e.target.value)} className={`border rounded focus:outline-none shadow-sm focus:border-blue-400 transition-colors ${isMultiRecurring ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2 py-1 text-lg font-semibold'} ${isMultiRecurring && !activeActivityIntervalStart ? 'bg-red-50 border-red-300' : 'bg-white border-blue-200'}`} />
                                                    <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
                                                    <input type="date" value={activeActivityIntervalEnd} onChange={(e) => setActiveActivityIntervalEnd(e.target.value)} className={`border rounded focus:outline-none shadow-sm focus:border-blue-400 transition-colors ${isMultiRecurring ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2 py-1 text-lg font-semibold'} ${isMultiRecurring && !activeActivityIntervalEnd ? 'bg-red-50 border-red-300' : 'bg-white border-blue-200'}`} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col w-full px-5 py-3">
                                            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-2 text-left">Frekvence opakování</label>
                                            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
                                                <div className="relative w-32 shrink-0">
                                                    <select value={activeActivityRecurrencePattern} onChange={(e) => handleRecurrencePatternChange(e.target.value)} className="w-full bg-white border border-blue-200 rounded px-3 py-1.5 text-sm font-semibold focus:border-blue-400 focus:outline-none shadow-sm appearance-none text-left cursor-pointer">
                                                        <option value="daily">Denně</option>
                                                        <option value="weekly">Týdně</option>
                                                        <option value="monthly">Měsíčně</option>
                                                        <option value="yearly">Ročně</option>
                                                        <option value="custom">Vlastní...</option>
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                                {activeActivityRecurrencePattern === 'custom' && (
                                                    <div className="flex items-center animate-in fade-in shrink-0 bg-white border border-blue-300 rounded-lg shadow-sm overflow-hidden h-[34px]">
                                                        <div className="px-3 h-full flex items-center bg-blue-50 border-r border-blue-200 text-[11px] font-bold text-blue-800 uppercase tracking-wide">Každý</div>
                                                        <input type="number" min="1" value={activeActivityRecurrenceInterval} onChange={(e) => setActiveActivityRecurrenceInterval(Number(e.target.value))} className="w-14 h-full text-center text-sm font-bold text-blue-900 focus:outline-none bg-transparent" />
                                                        <div className="w-px h-4 bg-blue-200 mx-0"></div>
                                                        <div className="relative h-full">
                                                            <select value={activeActivityRecurrenceUnit} onChange={(e) => setActiveActivityRecurrenceUnit(e.target.value)} className="appearance-none h-full pl-3 pr-8 text-sm font-semibold text-blue-900 bg-transparent focus:outline-none cursor-pointer"><option value="day">den</option><option value="week">týden</option><option value="month">měsíc</option><option value="year">rok</option></select>
                                                            <ChevronDown className="w-3.5 h-3.5 text-blue-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                )}
                                                {((activeActivityRecurrencePattern === 'custom' && activeActivityRecurrenceUnit === 'week') || activeActivityRecurrencePattern === 'weekly') && (
                                                    <div className="flex flex-wrap gap-1 animate-in fade-in slide-in-from-left-2 md:ml-2 items-center">
                                                        {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => (
                                                            <button key={dayIdx} onClick={() => toggleRecurrenceDay(dayIdx)} className={`w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center transition-all ${activeActivityRecurrenceDays.includes(dayIdx) ? 'bg-blue-600 text-white shadow-sm scale-110' : 'bg-white border border-blue-200 text-blue-400 hover:border-blue-400 hover:text-blue-600'}`}>{DAY_NAMES_SHORT[dayIdx].substring(0, 2)}</button>
                                                        ))}
                                                        {activeActivityRecurrencePattern === 'weekly' && (
                                                            <>
                                                                <div className="w-px h-6 bg-blue-200 mx-1"></div>
                                                                <button onClick={() => toggleRecurrenceWeek('odd')} className={`h-7 px-2 rounded-full text-[9px] font-bold flex items-center justify-center transition-all ${activeActivityRecurrenceWeeks.includes('odd') ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700'}`}>Lichý</button>
                                                                <button onClick={() => toggleRecurrenceWeek('even')} className={`h-7 px-2 rounded-full text-[9px] font-bold flex items-center justify-center transition-all ${activeActivityRecurrenceWeeks.includes('even') ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700'}`}>Sudý</button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* NOVÁ SEKCE: MULTI-DEFINICE (Rozvrh) */}
                                        {isMultiRecurring && (
                                            <div className="flex flex-col w-full px-5 py-3 border-t border-blue-200 bg-white/30">
                                                <div className="flex flex-col gap-3">
                                                    {activeActivityMultiDefs.length > 0 ? (
                                                        activeActivityMultiDefs.map((def, defIdx) => (
                                                            <div key={defIdx} className="flex items-end gap-2 animate-in fade-in slide-in-from-left-1 duration-200">
                                                                <div className="flex flex-col gap-1 shrink-0">
                                                                    {defIdx === 0 && <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide pl-0.5">Čas začátku a konce</label>}
                                                                    <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 h-[34px] shadow-sm shrink-0">
                                                                        <input type="time" value={def.startTime} onChange={(e) => {
                                                                            const next = [...activeActivityMultiDefs];
                                                                            next[defIdx].startTime = e.target.value;
                                                                            setActiveActivityMultiDefs(next);
                                                                        }} className="bg-transparent text-sm font-bold text-blue-900 focus:outline-none w-[70px]" />
                                                                        <span className="text-blue-300 text-xs">-</span>
                                                                        <input type="time" value={def.endTime} onChange={(e) => {
                                                                            const next = [...activeActivityMultiDefs];
                                                                            next[defIdx].endTime = e.target.value;
                                                                            setActiveActivityMultiDefs(next);
                                                                        }} className="bg-transparent text-sm font-bold text-blue-900 focus:outline-none w-[70px]" />
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                                    {defIdx === 0 && (
                                                                        <div className="flex items-center gap-2 pl-0.5">
                                                                            <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide leading-none m-0">Název aktivity</label>
                                                                            <div className="relative" ref={nameHelpRef}>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setShowNameHelp(!showNameHelp); }}
                                                                                    className="text-blue-400 hover:text-blue-600 transition-colors cursor-pointer flex items-center -mt-0.5"
                                                                                    title="Nápověda ke kódům v názvu"
                                                                                >
                                                                                    <Info className="w-4 h-4" />
                                                                                </button>
                                                                                {showNameHelp && (
                                                                                    <div className="absolute left-0 top-full mt-2 w-64 bg-slate-800 text-white p-3 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 text-xs leading-relaxed border border-slate-700 normal-case tracking-normal">
                                                                                        <div className="font-bold mb-2 text-blue-300 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                                                                                            <HelpCircle className="w-3.5 h-3.5" /> Automatické číslování
                                                                                        </div>
                                                                                        <p className="mb-2">V názvu můžete použít tyto kódy pro automatické doplnění čísel:</p>
                                                                                        <ul className="space-y-2">
                                                                                            <li>
                                                                                                <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">{"<d>"}</code>
                                                                                                <span className="ml-1">— Aktuální pořadové číslo dne (nezapočítává potlačené).</span>
                                                                                            </li>
                                                                                            <li>
                                                                                                <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">{"<s>"}</code>
                                                                                                <span className="ml-1">— Celkový počet naplánovaných dní (nezapočítává potlačené).</span>
                                                                                            </li>
                                                                                            <li>
                                                                                                <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">{"<n>"}</code>
                                                                                                <span className="ml-1">— Název skupiny / hlavní aktivity.</span>
                                                                                            </li>
                                                                                        </ul>
                                                                                        <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 italic">
                                                                                            Příklad: „{"<n>"} - Trénink {"<d>"} / {"<s>"}“ se zobrazí jako „Moje skupina - Trénink 1 / 10“.
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Např. Matematika, Trénink..."
                                                                        value={def.title || ""}
                                                                        onChange={(e) => {
                                                                            const next = [...activeActivityMultiDefs];
                                                                            next[defIdx].title = e.target.value;
                                                                            setActiveActivityMultiDefs(next);
                                                                        }}
                                                                        className={`w-full border rounded px-3 h-[34px] text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none shadow-sm transition-colors ${!(def.title && def.title.trim()) ? 'bg-red-50 border-red-300' : 'bg-white border-blue-200'}`}
                                                                    />
                                                                </div>

                                                                {activeActivityMultiDefs.length > 1 ? (
                                                                    <button
                                                                        onClick={() => setActiveActivityMultiDefs(activeActivityMultiDefs.filter((_, i) => i !== defIdx))}
                                                                        title="Smazat položku"
                                                                        className="w-8 h-[34px] flex items-center justify-center rounded transition-colors shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <div className="w-8 h-[34px] shrink-0"></div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-6 border-2 border-dashed border-blue-100 rounded-lg text-xs text-blue-400 italic">
                                                            Zatím nejsou přidány žádné položky rozvrhu.
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 mt-4">
                                                    <div className="flex-1 flex justify-end">
                                                        <button
                                                            onClick={() => setActiveActivityMultiDefs([...activeActivityMultiDefs, { startTime: "", endTime: "", title: "" }])}
                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" /> Přidat aktivitu
                                                        </button>
                                                    </div>
                                                    <div className="w-8 shrink-0"></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="h-px bg-blue-300 w-full my-3"></div>

                                        <div className="flex flex-col w-full px-5 pb-5">
                                            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-2 text-left">
                                                Seznam generovaných aktivit ({currentRecurrenceInstances.length})
                                            </label>

                                            {recurrenceNeedsUpdate && (
                                                <div className="mb-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 flex-wrap">
                                                    <div className="flex items-center gap-2 font-bold"><AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /><span>Parametry rozvrhu se změnily!</span></div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button onClick={(e) => { e.stopPropagation(); handleManualRegeneration(); }} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded text-[10px] font-bold transition-colors flex items-center gap-1"><RefreshCw className="w-3 h-3" /> PŘEGENEROVAT VÝSKYTY</button>
                                                        <button onClick={handleRevertRecurrenceChanges} className="px-2 py-1 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded text-[10px] font-bold transition-colors flex items-center gap-1"><Undo className="w-3 h-3" /> VRÁTIT ZMĚNY</button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1 w-full">
                                                {sortedInstancesForEditor.length > 0 ? (
                                                    sortedInstancesForEditor.map((inst, idx) => {
                                                        const isEditing = editingInstanceId === inst.id;
                                                        const isSuppressed = !!inst.isSuppressed;

                                                        const sIdx = inst._sourceIdx || 0;
                                                        if (!isSuppressed) {
                                                            sourceCurrentsEditor[sIdx] = (sourceCurrentsEditor[sIdx] || 0) + 1;
                                                        }
                                                        const currentDValue = isSuppressed ? "" : (sourceCurrentsEditor[sIdx] || "");
                                                        const totalSValue = isSuppressed ? "" : (sourceTotalsEditor[sIdx] || "");

                                                        let hasInstanceChanges = false;
                                                        if (isEditing) {
                                                            hasInstanceChanges =
                                                                instanceEditData.date !== inst.date ||
                                                                instanceEditData.endDate !== (inst.endDate || inst.date) ||
                                                                instanceEditData.startTime !== (inst.startTime || "") ||
                                                                instanceEditData.endTime !== (inst.endTime || "") ||
                                                                instanceEditData.title !== (inst.customTitle || activeActivityTitle || "");
                                                        }

                                                        const isModified = !!inst.isEdited;

                                                        let containerClass = "flex flex-1 items-start gap-1 p-2 rounded-lg border transition-all relative group min-w-0 w-full";
                                                        let checkBtnClass = "w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0 shadow-inner";

                                                        if (isSuppressed) {
                                                            containerClass += " bg-slate-100";
                                                            if (isModified) containerClass += " border-yellow-500 border-2 shadow-sm";
                                                            else containerClass += " border-slate-300";
                                                            checkBtnClass += " border border-slate-300 bg-slate-50 cursor-not-allowed opacity-50 text-transparent";
                                                        }
                                                        else if (isEditing) {
                                                            containerClass += " bg-yellow-50 border-yellow-300 shadow-md";
                                                            checkBtnClass += " border border-yellow-300 bg-white text-transparent opacity-50";
                                                        }
                                                        else {
                                                            containerClass += " bg-blue-50";
                                                            if (isModified) containerClass += " border-yellow-500 border-2 shadow-sm";
                                                            else containerClass += " border-blue-200";

                                                            checkBtnClass += " bg-white border border-blue-200 hover:bg-blue-100";
                                                        }

                                                        const inputBaseClass = "rounded px-1 py-0.5 text-xs font-bold transition-all focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm min-h-[24px]";
                                                        const inputEditClass = "bg-white border border-yellow-300 text-slate-800";
                                                        let textColorClass = isSuppressed ? "text-slate-400" : (isModified ? "text-blue-900" : "text-slate-700");
                                                        const finalInputClass = isEditing ? inputEditClass : `bg-transparent border-transparent cursor-default pointer-events-none ${textColorClass}`;

                                                        const sDate = formatDateCZ(inst.date);
                                                        const sTime = inst.startTime;
                                                        const eTime = inst.endTime;

                                                        const rawTitle = inst.customTitle || (isMultiRecurring ? "Bez názvu" : activeActivityTitle || "Bez názvu");
                                                        const title = isSuppressed ? rawTitle : rawTitle.replace(/<d>/g, currentDValue).replace(/<s>/g, totalSValue).replace(/<n>/g, activeActivityTitle || "");

                                                        let displayEndDateRaw = inst.endDate || inst.date;
                                                        if (sTime && eTime && sTime > eTime && inst.date === displayEndDateRaw) {
                                                            const d = new Date(inst.date);
                                                            d.setDate(d.getDate() + 1);
                                                            displayEndDateRaw = d.toISOString().split('T')[0];
                                                        }
                                                        const eDateStr = formatDateCZ(displayEndDateRaw);

                                                        let timeString = (inst.date !== displayEndDateRaw)
                                                            ? `${sDate} ${sTime} - ${eDateStr} ${eTime}`
                                                            : (sTime && eTime ? `${sDate} ${sTime} - ${eTime}` : (sTime ? `${sDate} ${sTime}` : sDate));

                                                        return (
                                                            <div key={inst.id} className="flex items-start gap-0.5 w-full min-w-0">
                                                                <div className={containerClass}>
                                                                    <button
                                                                        onClick={() => !isSuppressed && !isEditing && toggleRecurrenceInstanceComplete(inst.id)}
                                                                        disabled={isSuppressed || isEditing}
                                                                        className={checkBtnClass}
                                                                    >
                                                                        {!isSuppressed && !isEditing && (
                                                                            inst.completed ?
                                                                                <Check className="w-4 h-4 text-green-600" strokeWidth={3} /> :
                                                                                <X className="w-4 h-4 text-red-500" strokeWidth={3} />
                                                                        )}
                                                                    </button>

                                                                    {isEditing ? (
                                                                        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
                                                                            <input type="date" value={instanceEditData.date} onChange={(e) => setInstanceEditData({ ...instanceEditData, date: e.target.value })} className={`${inputBaseClass} ${finalInputClass} w-24`} />
                                                                            <input type="time" value={instanceEditData.startTime} onChange={(e) => setInstanceEditData({ ...instanceEditData, startTime: e.target.value })} className={`${inputBaseClass} ${finalInputClass} w-[72px] text-center px-0`} />
                                                                            <ArrowRight className={`w-3 h-3 shrink-0 ${isSuppressed ? 'text-slate-300' : 'text-yellow-600'}`} />
                                                                            <input type="date" value={instanceEditData.endDate} onChange={(e) => setInstanceEditData({ ...instanceEditData, endDate: e.target.value })} className={`${inputBaseClass} ${finalInputClass} w-24`} />
                                                                            <input type="time" value={instanceEditData.endTime} onChange={(e) => setInstanceEditData({ ...instanceEditData, endTime: e.target.value })} className={`${inputBaseClass} ${finalInputClass} w-[72px] text-center px-0`} />
                                                                            <textarea ref={activeInstanceTextareaRef} value={instanceEditData.title} onChange={(e) => setInstanceEditData({ ...instanceEditData, title: e.target.value })} className={`${inputBaseClass} ${finalInputClass} flex-1 min-w-[120px] resize-none overflow-hidden leading-normal`} rows={1} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight + 2) + 'px'; }} />
                                                                            <div className="flex gap-1 ml-auto shrink-0">
                                                                                {hasInstanceChanges && <button onClick={saveEditingInstance} className="p-1 bg-yellow-400 hover:bg-yellow-50 text-yellow-900 rounded shadow-sm animate-in zoom-in duration-200"><Save className="w-3.5 h-3.5" /></button>}
                                                                                <button onClick={cancelEditingInstance} className="p-1 bg-white border border-yellow-300 text-slate-500 hover:text-red-600 rounded shadow-sm"><X className="w-3.5 h-3.5" /></button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className={`py-1 px-1 flex-1 flex flex-col justify-center min-w-0 ${textColorClass}`}>
                                                                                <div className="text-xs font-bold leading-normal whitespace-pre-wrap break-words">{timeString} {title}</div>
                                                                                {((inst.linkedNoteIds && inst.linkedNoteIds.length > 0) || (inst.subtasks && inst.subtasks.length > 0)) && (
                                                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                                                        {inst.subtasks && inst.subtasks.map(sub => {
                                                                                            const chipClass = sub.completed ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-blue-50 text-blue-900 border-blue-200';
                                                                                            const iconClass = sub.completed ? 'text-slate-400' : 'text-blue-700';
                                                                                            return (
                                                                                                <span key={sub.id} className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border h-auto relative z-20 ${chipClass}`}>
                                                                                                    <div className={`w-4 h-4 flex items-center justify-center rounded-sm shrink-0 -ml-0.5`}>
                                                                                                        {sub.completed ? <Check className="w-3 h-3 text-green-600" strokeWidth={3} /> : <X className="w-3 h-3 text-red-500" strokeWidth={3} />}
                                                                                                    </div>
                                                                                                    <span className="w-px h-3 bg-current opacity-20 mx-0.5"></span>
                                                                                                    <CalendarIcon className={`w-3 h-3 shrink-0 ${iconClass}`} />
                                                                                                    <span className={`whitespace-normal text-left break-words font-medium leading-none ${sub.completed ? 'line-through opacity-75' : ''}`}>{sub.title || "Bez názvu"}</span>
                                                                                                </span>
                                                                                            );
                                                                                        })}
                                                                                        {inst.linkedNoteIds && inst.linkedNoteIds.map(noteId => {
                                                                                            const chipClass = "bg-yellow-50 text-yellow-800 border-yellow-200";
                                                                                            const iconClass = "text-yellow-600";
                                                                                            return (
                                                                                                <span key={noteId} className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border h-auto relative z-20 ${chipClass}`}>
                                                                                                    <div className="w-3.5 h-3.5 shrink-0"></div>
                                                                                                    <span className="w-px h-3 bg-current opacity-20 mx-0.5"></span>
                                                                                                    <StickyNote className={`w-3 h-3 shrink-0 ${iconClass}`} />
                                                                                                    <span onClick={(e) => { e.stopPropagation(); handleOpenNoteEditor(noteId); }} className="whitespace-normal text-left break-words cursor-pointer hover:bg-black/10 rounded px-1 -mx-1 transition-colors font-medium leading-none">{sharedNotes[noteId]?.title || "Poznámka"}</span>
                                                                                                </span>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="absolute right-1 top-[3px] flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-md border border-slate-200 z-10">
                                                                                {isModified && <button onClick={(e) => restoreRecurrenceInstance(e, inst.id)} className="p-1.5 hover:bg-yellow-100 text-yellow-600 rounded transition-colors"><RotateCw className="w-3.5 h-3.5" /></button>}
                                                                                <button onClick={(e) => { e.stopPropagation(); startEditingInstance(inst); }} className="p-1.5 hover:bg-blue-100 text-slate-500 rounded transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                                                                <button onClick={(e) => { e.stopPropagation(); toggleRecurrenceInstanceSuppression(inst.id); }} className={`p-1.5 rounded transition-colors ${isSuppressed ? 'hover:bg-green-100 text-slate-500' : 'hover:bg-slate-100 text-slate-500'}`}>{isSuppressed ? <Eye className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}</button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-center py-4 text-slate-400 italic text-xs">Zatím nejsou vygenerovány žádné výskyty.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 flex flex-wrap gap-4 items-center mt-2">
                                        <div className="flex flex-col"><label className="text-[10px] font-bold text-blue-800 uppercase mb-1">Začátek</label><div className="flex gap-1"><input type="date" value={activeActivityStart} onChange={(e) => setActiveActivityStart(e.target.value)} className="border rounded px-2 py-1 text-lg font-semibold focus:outline-none shadow-sm bg-white border-blue-200 focus:border-blue-400" /><input type="time" value={activeActivityStartTime} onChange={(e) => setActiveActivityStartTime(e.target.value)} className="bg-white border border-blue-200 rounded px-2 py-1 text-lg font-semibold focus:border-blue-400 focus:outline-none shadow-sm" /></div></div>
                                        <ArrowRight className="w-4 h-4 mt-4 text-blue-400" />
                                        <div className="flex flex-col"><label className="text-[10px] font-bold text-blue-800 uppercase mb-1">Konec</label><div className="flex gap-1"><input type="date" value={activeActivityEnd} onChange={(e) => setActiveActivityEnd(e.target.value)} className="border rounded px-2 py-1 text-lg font-semibold focus:outline-none shadow-sm bg-white border-blue-200 focus:border-blue-400" /><input type="time" value={activeActivityEndTime} onChange={(e) => setActiveActivityEndTime(e.target.value)} className="bg-white border border-blue-200 rounded px-2 py-1 text-lg font-semibold focus:border-blue-400 focus:outline-none shadow-sm" /></div></div>
                                    </div>
                                )}

                                {activeActivityType === 'single' && (
                                    <div className="bg-transparent p-3 border-t border-blue-200 flex flex-col gap-2 shrink-0 relative z-20">
                                        <div className="flex flex-wrap gap-1.5 mb-2 max-h-[100px] overflow-y-auto">
                                            {allAttachments.map((item) => {
                                                const isNote = item._type === 'note';
                                                const chipClass = isNote ? "bg-yellow-50 text-yellow-800 border-yellow-200" : "bg-purple-50 text-purple-900 border-purple-200";
                                                const iconClass = isNote ? "text-yellow-600" : "text-purple-600";

                                                if (item.isSuppressed) {
                                                    return (
                                                        <span key={item.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border h-auto bg-slate-100 text-slate-500 border-slate-300">
                                                            {renderTypeIcon(isNote ? 'note' : 'project', "w-3 h-3 text-slate-400 shrink-0")}
                                                            <span className="font-medium whitespace-normal break-words">{item.title}</span>
                                                            <button onClick={() => handleInlineNoteToggleForActivity(item.id, false)} className="ml-1 hover:bg-black/10 rounded p-0.5"><X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" /></button>
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <span key={item.id} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border h-auto ${chipClass}`}>
                                                        <div className="w-3.5 h-3.5 shrink-0"></div>
                                                        <span className="w-px h-3 bg-current opacity-20 mx-0.5"></span>
                                                        {renderTypeIcon(isNote ? 'note' : 'project', `w-3 h-3 ${iconClass} shrink-0`)}
                                                        <span onClick={(e) => { e.stopPropagation(); if (isNote) handleOpenNoteEditor(item.id); else handleOpenProjectEditor(item.id); }} className="whitespace-normal text-left break-words cursor-pointer hover:bg-black/10 rounded px-1 -mx-1 transition-colors font-medium">{item.title}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); handleInlineNoteToggleForActivity(item.id, false); }} className="ml-1 hover:bg-black/10 rounded p-0.5 transition-colors" title="Odpojit"><X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" /></button>
                                                    </span>
                                                )
                                            })}
                                        </div>
                                        <div className="relative flex flex-col" ref={activityLinkDropdownRef}>
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 text-blue-400/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <input type="text" placeholder="Připojit projekt či poznámku..." value={linkSearchQuery} onFocus={() => setIsLinkDropdownOpen(true)} onChange={(e) => { setLinkSearchQuery(e.target.value); if (!isLinkDropdownOpen) setIsLinkDropdownOpen(true); }} className="w-full bg-white border border-blue-300 pl-9 pr-8 py-2 text-sm text-blue-900 placeholder:text-blue-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all shadow-sm" />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600/50 pointer-events-none">{isLinkDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
                                            </div>
                                            {isLinkDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-300 rounded-lg max-h-60 flex flex-col shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                                                    <div className="overflow-y-auto p-1">
                                                        {searchResults.length > 0 ? (
                                                            searchResults.map(item => {
                                                                const isLinked = tempActivityLinks.has(item.id);
                                                                const isNote = item._type === 'note';
                                                                const rowHoverClass = isNote ? "hover:bg-yellow-50 border-yellow-50" : "hover:bg-purple-50 border-purple-50";
                                                                const checkBgClass = isNote ? (isLinked ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white border-slate-300 text-transparent group-hover:border-yellow-300') : (isLinked ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300 text-transparent group-hover:border-purple-300');
                                                                const iconColor = isNote ? "text-yellow-500" : "text-purple-500";
                                                                const textColor = isNote ? "text-yellow-900" : "text-purple-900";
                                                                return (
                                                                    <button key={item.id} onClick={(e) => { e.stopPropagation(); handleInlineNoteToggleForActivity(item.id, !isLinked); }} className={`w-full text-left py-1.5 px-2 border-b last:border-0 flex items-start gap-2 transition-colors rounded ${rowHoverClass} group`}>
                                                                        <div className={`w-4 h-4 flex items-center justify-center rounded border transition-colors shrink-0 mt-0.5 ${checkBgClass}`}><Check className="w-3 h-3" strokeWidth={3} /></div>
                                                                        {isNote ? <StickyNote className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${iconColor}`} /> : <Folder className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${iconColor}`} />}
                                                                        <span className={`flex-1 text-xs break-words leading-tight font-medium ${textColor}`}>{item.title}</span>
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-slate-400 italic">{linkSearchQuery ? "Žádné výsledky." : "Začněte psát pro vyhledání..."}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}