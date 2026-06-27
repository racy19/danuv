import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Check, Calendar as CalendarIcon, List, X, Save, StickyNote, Database, Info, HelpCircle, Settings, ArrowUpDown, Download, Upload, FileDown, FileUp, ShieldAlert, Folder, Search, Eye, EyeOff, Pin, MoreHorizontal, RotateCw } from 'lucide-react';
import { DAY_NAMES_SHORT, getDateStr, getDayName, getTodayStr } from './utils/dateUtils';
import { loadEvents, loadFromStorage, loadNotes, saveEvents, saveNotes, saveToStorage, STORAGE_KEYS } from './services/storageService';
import { defaultSharedNotes } from './data/mockNotes';
import { GROUP_ORDER_OPTIONS, INTERNAL_SORT_OPTIONS, sortAndGroupItems } from './utils/sortUtils';
import { buildRecurrenceGenerationInput, createRecurrenceSignature, generateRecurrenceInstances, hasRecurrenceStructureChanged, normalizeMultiDefs, parseRecurrenceSignature, sortRecurrenceInstances, validateRecurrence, validateSingleActivity } from './utils/recurrenceUtils';
import { areSetsEqual } from './utils/commonUtils';
import { AcitvityIcon } from './components/icons/ActivityIcon';
import { CustomSortSelect } from './components/ui/CustomSortSelect';
import { ListEventCard } from './components/events/event-card/ListEventCard';
import { getLinkedNoteTargets, getNoteLinkSearchResults, hasNoteEditorChanges } from './utils/noteEditorUtils';
import { NoteEditorModal } from './components/notes/note-editor/NoteEditorModal';
import { NotePickerModal } from './components/notes/NotePickerModal';
import { ActivityEditorHeader } from './components/events/activity-editor/ActivityEditorHeader';
import { ActivityEditorBasicFields } from './components/events/activity-editor/ActivityEditorBasicFields';
import { ActivityAttachments } from './components/events/activity-editor/ActivityAttachments';
import { SingleActivityDateFields } from './components/events/activity-editor/recurrence/SingleActivityDateFields';
import { RecurrenceEditor } from './components/events/activity-editor/recurrence/RecurrenceEditor';
import { ActivityEditorModal } from './components/events/activity-editor/ActivityEditorModal';

// const RecursiveItem = () => { return null; }; Tohle asi prijde smazat, protoze tomu bro nerozumim 
// a nic nefunguje, ale nechci to jen tak smazat, kdyz to tam je a ja nevim proc

export default function KalendarApp() {
	const [activeView, setActiveView] = useState('list');
	const [startDate] = useState(new Date());

	const [undoData, setUndoData] = useState(null);
	const [editingId, setEditingId] = useState(null);
	const [draggingId, setDraggingId] = useState(null);
	const [justDroppedId, setJustDroppedId] = useState(null);
	const [draggingNote, setDraggingNote] = useState(null);
	const [originalEvents, setOriginalEvents] = useState({});
	const [deleteConfirmationLevel, setDeleteConfirmationLevel] = useState(0);
	const [warningMsg, setWarningMsg] = useState(null);
	const [expandedIds, setExpandedIds] = useState([]);
	const [openTypeDropdownId, setOpenTypeDropdownId] = useState(null);
	const [openActionMenuId, setOpenActionMenuId] = useState(null);
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

	const [showStats, setShowStats] = useState(() =>
		loadFromStorage(STORAGE_KEYS.showStats, true)
	);

	useEffect(() => {
		saveToStorage(STORAGE_KEYS.showStats, showStats);
	}, [showStats]);

	const defaultListSortSettings = {
		noDate: { group: 'act_note', actSort: 'custom', noteSort: 'custom' },
		withDate: { group: 'act_note', actSort: 'dateAsc', noteSort: 'custom' },
		hidden: { group: 'act_note', actSort: 'dateAsc', noteSort: 'custom' }
	};

	const [listSortSettings, setListSortSettings] = useState(() => {
		const saved = loadFromStorage(STORAGE_KEYS.listSort, defaultListSortSettings);

		if (typeof saved.noDate === 'string') {
			return defaultListSortSettings;
		}

		return saved;
	});

	useEffect(() => {
		saveToStorage(STORAGE_KEYS.listSort, listSortSettings);
	}, [listSortSettings]);

	const [sharedNotes, setSharedNotes] = useState(() =>
		loadNotes()
	);
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

	const getRecurrenceSignature = () =>
		createRecurrenceSignature({
			intervalStart: activeActivityIntervalStart,
			intervalEnd: activeActivityIntervalEnd,
			pattern: activeActivityRecurrencePattern,
			interval: activeActivityRecurrenceInterval,
			unit: activeActivityRecurrenceUnit,
			days: activeActivityRecurrenceDays,
			startTime: activeActivityStartTime,
			endTime: activeActivityEndTime,
			weeks: activeActivityRecurrenceWeeks,
			multiDefs: activeActivityMultiDefs,
		});

	useEffect(() => {
		if (isActivityEditorOpen && (activeActivityType === 'recurring' || activeActivityType === 'multi_recurring') && lastRecurrenceSignature.current) {
			try {
				const original = parseRecurrenceSignature(lastRecurrenceSignature.current);

				if (!original) {
					setRecurrenceNeedsUpdate(false);
					return;
				}

				const changed = hasRecurrenceStructureChanged(original, {
					intervalStart: activeActivityIntervalStart,
					intervalEnd: activeActivityIntervalEnd,
					pattern: activeActivityRecurrencePattern,
					interval: activeActivityRecurrenceInterval,
					unit: activeActivityRecurrenceUnit,
					days: activeActivityRecurrenceDays,
					startTime: activeActivityStartTime,
					endTime: activeActivityEndTime,
					weeks: activeActivityRecurrenceWeeks,
					multiDefs: activeActivityMultiDefs,
				});

				setRecurrenceNeedsUpdate(changed);
			} catch (err) {
				console.error("Failed to parse last recurrence signature", err);
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
			buildRecurrenceGenerationInput({
				activityType: activeActivityType,
				intervalStart: activeActivityIntervalStart,
				intervalEnd: activeActivityIntervalEnd,
				pattern: activeActivityRecurrencePattern,
				interval: activeActivityRecurrenceInterval,
				unit: activeActivityRecurrenceUnit,
				days: activeActivityRecurrenceDays,
				startTime: activeActivityStartTime,
				endTime: activeActivityEndTime,
				weeks: activeActivityRecurrenceWeeks,
				multiDefs: normalizeMultiDefs(activeActivityMultiDefs),
			})
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

		console.log("Regenerating recurrence instances. Fresh:", freshInstances, "Merged:", mergedInstances);

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

	const formatDate = (d) => d ? d.replace(/-/g, '.') : "";

	const [events, setEvents] = useState(() =>
		loadEvents()
	);
	const [newEventTitle, setNewEventTitle] = useState("");
	const [addingToDate, setAddingToDate] = useState(null);

	useEffect(() => {
		const hydrateInstances = (evs) => {
			return evs.map(e => {
				if ((e.activityType === 'recurring' || e.activityType === 'multi_recurring') && (!e.recurrenceInstances || e.recurrenceInstances.length === 0)) {
					const instances = generateRecurrenceInstances(
						buildRecurrenceGenerationInput({
							activityType: e.activityType,
							intervalStart: e.intervalStart,
							intervalEnd: e.intervalEnd,
							pattern: e.recurrencePattern,
							interval: e.recurrenceInterval || 1,
							unit: e.recurrenceUnit || "day",
							days: e.recurrenceDays || [],
							startTime: e.startTime,
							endTime: e.endTime,
							weeks: e.recurrenceWeeks || ["odd", "even"],
							multiDefs: e.multiDefs || [],
						})
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
		saveEvents(events);
	}, [events]);

	useEffect(() => {
		saveNotes(sharedNotes);
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
			const loadedDefs =
				item.activityType === "multi_recurring"
					? normalizeMultiDefs(item.multiDefs)
					: item.multiDefs || [];

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

			if (activeActivityType === "single") {
				const singleActivityError = validateSingleActivity({
					startDate: activeActivityStart,
					endDate: activeActivityEnd,
					startTime: activeActivityStartTime,
					endTime: activeActivityEndTime,
				});

				if (singleActivityError) {
					setWarningMsg(singleActivityError);
					setTimeout(() => setWarningMsg(null), 5000);
					return;
				}
			}

			const recurrenceError = validateRecurrence({
				activityType: activeActivityType,
				title: activeActivityTitle,
				intervalStart: activeActivityIntervalStart,
				intervalEnd: activeActivityIntervalEnd,
				multiDefs: activeActivityMultiDefs,
				recurrenceNeedsUpdate,
				generatedInstancesCount: currentRecurrenceInstances.length,
			});

			if (recurrenceError) {
				setWarningMsg(recurrenceError);
				setTimeout(() => setWarningMsg(null), 5000);
				return;
			}

			const foundObj = findItemAndParent(events, activeActivityId);
			const existingItem = foundObj ? foundObj.item : null;

			let newRecurrenceInstances = currentRecurrenceInstances;

			if (activeActivityType === 'single') {
				newRecurrenceInstances = [];
			}

			const normalizedMultiDefs =
				activeActivityType === "multi_recurring"
					? normalizeMultiDefs(activeActivityMultiDefs)
					: [];

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
					multiDefs: normalizedMultiDefs, // Uložení definic
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

	const handleViewSwitch = (viewName) => {
		if (editingId !== null) {
			setWarningMsg("Potvrďte úpravy v záznamu");
			setTimeout(() => setWarningMsg(null), 5000);
			return;
		}
		setViewSearchQuery("");
		setActiveView(viewName);
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
										<AcitvityIcon type={item.type} className={`w-3 h-3 ${iconClass} shrink-0`} />
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
								<AcitvityIcon type={isNote ? 'note' : (item.type || 'event')} className={`w-3 h-3 ${iconClass} shrink-0`} />
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
							null
							// co to what the fuck je ??
							// <RecursiveItem
							// 	key={ev.id} item={ev} level={0} parentId={null} activeView={activeView}
							// 	expandedIds={expandedIds} setExpandedIds={setExpandedIds} editingId={editingId} setEditingId={setEditingId}
							// 	draggingId={draggingId} justDroppedId={justDroppedId} allEvents={events} findItemAndParent={findItemAndParent}
							// 	originalEvents={originalEvents} setOriginalEvents={setOriginalEvents} openTypeDropdownId={openTypeDropdownId} setOpenTypeDropdownId={setOpenTypeDropdownId}
							// 	open ActionMenuId={openActionMenuId} setOpenActionMenuId={setOpenActionMenuId} sortConfig={sortConfig} updateEventField={updateEventField} toggleComplete={toggleComplete} indentItem={indentItem}
							// 	outdentItem={outdentItem} addSubtask={addSubtask} duplicateEvent={duplicateEvent} deleteEvent={deleteEvent} updateTree={updateTree}
							// 	handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit} handleRequestEdit={handleRequestEdit} onDragStart={onDragStart} onDragEnd={onDragEnd}
							// 	onMoveBefore={onMoveBefore} onMoveAfter={onMoveAfter} onMoveAsChild={onMoveAsChild} onMoveAsParent={onMoveAsParent} getSortedItems={getSortedItems} getDayName={getDayName} getTodayStr={getTodayStr}
							// 	sharedNotes={sharedNotes} onOpenNotePicker={handleOpenNotePicker} onOpenNoteEditor={handleOpenNoteEditor} onUnlinkNote={handleUnlinkNote}
							// />
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

				<NotePickerModal
					isOpen={isNotePickerOpen}
					notes={Object.values(sharedNotes)}
					onClose={() => setIsNotePickerOpen(false)}
					onCreateAndLinkNote={handleCreateAndLinkNote}
					onLinkNote={handleLinkNote}
				/>

				{/* EDITOR POZNÁMKY (Obnovený) */}
				{isNoteEditorOpen && activeNoteId && (() => {
					const noteLinksArr = getLinkedNoteTargets(
						tempNoteLinks,
						events,
						findItemAndParent,
						getDisplayTitle
					);

					const searchResults = getNoteLinkSearchResults(
						getAllTasksFlat(events),
						linkSearchQuery
					);
					const originalNote = sharedNotes[activeNoteId];

					const hasNoteChanges = hasNoteEditorChanges(
						originalNote,
						activeNoteTitle,
						activeNoteContent,
						activeNoteType,
						tempNoteLinks,
						originalNoteLinks,
						tempStatusChanges,
						areSetsEqual
					);

					return (
						<NoteEditorModal
							isOpen={isNoteEditorOpen && Boolean(activeNoteId)}
							zIndexStyle={{ zIndex: editorZIndices.note }}

							noteType={activeNoteType}
							title={activeNoteTitle}
							content={activeNoteContent}

							hasChanges={hasNoteChanges}

							linkedItems={noteLinksArr}
							searchResults={searchResults}
							linkedIds={tempNoteLinks}

							isLinkDropdownOpen={isLinkDropdownOpen}
							linkSearchQuery={linkSearchQuery}

							noteTitleRef={noteTitleRef}
							linkDropdownRef={linkDropdownRef}

							onClose={() => setIsNoteEditorOpen(false)}
							onSave={handleSaveNoteContent}

							onNoteTypeChange={setActiveNoteType}
							onTitleChange={setActiveNoteTitle}
							onContentChange={setActiveNoteContent}

							onUnlinkItem={(itemId) => handleInlineTaskToggle(itemId, false)}
							onLinkSearchQueryChange={setLinkSearchQuery}
							onOpenLinkDropdown={() => setIsLinkDropdownOpen(true)}
							onToggleLink={handleInlineTaskToggle}
						/>
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

					const sortedInstancesForEditor = sortRecurrenceInstances(
						currentRecurrenceInstances
					);

					const sourceTotalsEditor = {};
					sortedInstancesForEditor.forEach(i => {
						if (!i.isSuppressed) {
							const sIdx = i._sourceIdx || 0;
							sourceTotalsEditor[sIdx] = (sourceTotalsEditor[sIdx] || 0) + 1;
						}
					});

					const sourceCurrentsEditor = {};

					return (
						<ActivityEditorModal
							isOpen={isActivityEditorOpen}
							onClose={() => setIsActivityEditorOpen(false)}
							contentRef={activityEditorRef}
							zIndexStyle={{ zIndex: editorZIndices.activity }}
						>
							<ActivityEditorHeader
								activityType={activeActivityType}
								multiDefs={activeActivityMultiDefs}
								hasChanges={hasChanges}
								onActivityTypeChange={setActiveActivityType}
								onMultiDefsChange={setActiveActivityMultiDefs}
								onSave={handleSaveActivity}
								onClose={() => setIsActivityEditorOpen(false)}
							/>

							<ActivityEditorBasicFields
								activityType={activeActivityType}
								title={activeActivityTitle}
								completed={activeActivityCompleted}
								showNameHelp={showNameHelp}
								nameHelpRef={nameHelpRef}
								titleRef={activityTitleRef}
								onTitleChange={setActiveActivityTitle}
								onCompletedChange={setActiveActivityCompleted}
								onShowNameHelpChange={setShowNameHelp}
							/>

							{(isRecurring || isMultiRecurring) ? (
								<RecurrenceEditor
									isMultiRecurring={isMultiRecurring}
									startTime={activeActivityStartTime}
									endTime={activeActivityEndTime}
									intervalStart={activeActivityIntervalStart}
									intervalEnd={activeActivityIntervalEnd}
									pattern={activeActivityRecurrencePattern}
									interval={activeActivityRecurrenceInterval}
									unit={activeActivityRecurrenceUnit}
									days={activeActivityRecurrenceDays}
									weeks={activeActivityRecurrenceWeeks}
									multiDefs={activeActivityMultiDefs}
									currentInstances={currentRecurrenceInstances}
									sortedInstances={sortedInstancesForEditor}
									sourceTotals={sourceTotalsEditor}
									recurrenceNeedsUpdate={recurrenceNeedsUpdate}
									editingInstanceId={editingInstanceId}
									instanceEditData={instanceEditData}
									activeActivityTitle={activeActivityTitle}
									sharedNotes={sharedNotes}
									showNameHelp={showNameHelp}
									nameHelpRef={nameHelpRef}
									activeInstanceTextareaRef={activeInstanceTextareaRef}
									onStartTimeChange={setActiveActivityStartTime}
									onEndTimeChange={setActiveActivityEndTime}
									onIntervalStartChange={setActiveActivityIntervalStart}
									onIntervalEndChange={setActiveActivityIntervalEnd}
									onPatternChange={handleRecurrencePatternChange}
									onIntervalChange={setActiveActivityRecurrenceInterval}
									onUnitChange={setActiveActivityRecurrenceUnit}
									onToggleDay={toggleRecurrenceDay}
									onToggleWeek={toggleRecurrenceWeek}
									onMultiDefsChange={setActiveActivityMultiDefs}
									onShowNameHelpChange={setShowNameHelp}
									onRegenerate={handleManualRegeneration}
									onRevertChanges={handleRevertRecurrenceChanges}
									onToggleComplete={toggleRecurrenceInstanceComplete}
									onEditDataChange={setInstanceEditData}
									onSaveEdit={saveEditingInstance}
									onCancelEdit={cancelEditingInstance}
									onStartEdit={startEditingInstance}
									onRestore={restoreRecurrenceInstance}
									onToggleSuppression={toggleRecurrenceInstanceSuppression}
									onOpenNote={handleOpenNoteEditor}
								/>
							) : <SingleActivityDateFields
								startDate={activeActivityStart}
								endDate={activeActivityEnd}
								startTime={activeActivityStartTime}
								endTime={activeActivityEndTime}
								onStartDateChange={setActiveActivityStart}
								onEndDateChange={setActiveActivityEnd}
								onStartTimeChange={setActiveActivityStartTime}
								onEndTimeChange={setActiveActivityEndTime}
							/>}

							{activeActivityType === "single" && (
								<ActivityAttachments
									attachments={allAttachments}
									searchResults={searchResults}
									linkedIds={tempActivityLinks}
									searchQuery={linkSearchQuery}
									isDropdownOpen={isLinkDropdownOpen}
									dropdownRef={activityLinkDropdownRef}
									onSearchQueryChange={setLinkSearchQuery}
									onOpenDropdown={() => setIsLinkDropdownOpen(true)}
									onToggleAttachment={handleInlineNoteToggleForActivity}
									onOpenNote={handleOpenNoteEditor}
									onOpenProject={handleOpenProjectEditor}
								/>
							)}
						</ActivityEditorModal>
					);
				})()}
			</div>
		</div>
	);
}