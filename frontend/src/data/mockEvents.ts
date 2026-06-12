import { CalendarItem } from "../../../shared/types/calendar";
import { getRelativeDateStr } from "../utils/dateUtils";

export const defaultEvents: CalendarItem[] = [
    { id: 50, title: "Zaplatit složenky (zapomenuto) 💸", start: getRelativeDateStr(-2), end: getRelativeDateStr(-2), startTime: "10:00", endTime: "10:15", completed: false, type: 'event', subtasks: [] },
    { id: 51, title: "Uklidit garáž 🧹", start: getRelativeDateStr(-2), end: getRelativeDateStr(-2), startTime: "14:00", endTime: "16:00", completed: true, type: 'event', subtasks: [] },
    {
        id: 100, title: "Včerejší nákup na víkend 🛒", start: getRelativeDateStr(-1), end: getRelativeDateStr(-1), startTime: "17:00", endTime: "18:00", completed: true, type: 'event',
        subtasks: [
            { id: 1001, title: "Mléko a vajíčka", completed: true, type: 'event', subtasks: [] },
            { id: 1002, title: "Čerstvé pečivo", completed: true, type: 'event', subtasks: [] },
            { id: 1003, title: "Zelenina na salát", completed: true, type: 'event', subtasks: [] }
        ]
    },
    { id: 101, title: "Odeslat fakturu (po splatnosti) 📄", start: getRelativeDateStr(-1), end: getRelativeDateStr(-1), completed: false, type: 'event', subtasks: [] },
    { id: 200, title: "Ranní stand-up s týmem", start: getRelativeDateStr(0), end: getRelativeDateStr(0), startTime: "09:00", endTime: "09:30", completed: true, type: 'event', subtasks: [] },
    { id: 201, title: "Práce na projektu Kalendář 💻", start: getRelativeDateStr(0), end: getRelativeDateStr(0), startTime: "10:00", endTime: "15:00", completed: false, type: 'event', subtasks: [] },
    { id: 602, title: "Vyměnit prasklou žárovku v předsíni 💡", completed: false, type: 'event', subtasks: [] },
    { id: 300, title: "Příprava podkladů na poradu 📊", start: getRelativeDateStr(1), end: getRelativeDateStr(1), startTime: "13:00", endTime: "14:00", completed: false, type: 'event', subtasks: [] },
    { id: 301, title: "Koupit dárek k narozeninám 🎁", start: getRelativeDateStr(1), end: getRelativeDateStr(1), completed: true, type: 'event', subtasks: [] },
    { id: 400, title: "Servis auta (ráno) 🚗", start: getRelativeDateStr(2), end: getRelativeDateStr(2), startTime: "08:00", endTime: "09:00", completed: false, type: 'event', subtasks: [] },
    { id: 700, title: "Pořešit popelnici ve Hřebči", start: "2026-02-02", end: "2026-02-02", completed: false, type: 'event', linkedNoteIds: [3, 4], subtasks: [] },
    {
        id: 800, title: "Rekonstrukce 🔨", type: 'project', start: getRelativeDateStr(0), end: getRelativeDateStr(30), completed: false, isPinned: true, linkedNoteIds: [5, 6, 7, 3],
        subtasks: [
            { id: 801, title: "Vybrat dlažbu", type: 'event', completed: false, subtasks: [] },
            { id: 802, title: "Kontaktovat instalatéra", type: 'event', completed: false, subtasks: [] },
            { id: 803, title: "Koupit penetraci", type: 'event', completed: false, subtasks: [] },
            { id: 804, title: "Zaměřit kuchyň", type: 'event', completed: false, subtasks: [] },
            { id: 805, title: "Objednat kontejner na suť", type: 'event', completed: false, subtasks: [] },
            { id: 806, title: "Domluvit termín s elektrikářem", type: 'event', completed: false, subtasks: [] },
            { id: 807, title: "Vybrat barvu výmalby", type: 'event', completed: false, subtasks: [] },
            { id: 808, title: "Koupit zakrývací fólie", type: 'event', completed: false, subtasks: [] }
        ]
    },
    {
        id: 2000, title: "Rekonstrukce2 🏠", type: 'project', start: getRelativeDateStr(5), end: getRelativeDateStr(45), completed: false, isPinned: false, linkedNoteIds: [20],
        subtasks: [
            {
                id: 2001, title: "Okna", type: 'event', completed: false, subtasks: [
                    { id: 20011, title: "okno kuchyň", type: 'event', completed: false, subtasks: [] },
                    { id: 20012, title: "okno obývák", type: 'event', completed: false, subtasks: [] },
                    { id: 20013, title: "okno pracovna", type: 'event', completed: false, subtasks: [] }
                ]
            },
            { id: 2002, title: "Podlahy", type: 'event', completed: false, subtasks: [] },
            { id: 2003, title: "Zdi", type: 'event', completed: false, subtasks: [] },
            { id: 2004, title: "Topení", type: 'event', completed: false, linkedNoteIds: [21], subtasks: [] },
            { id: 2005, title: "Voda", type: 'event', completed: false, subtasks: [] },
            { id: 2006, title: "Odpady", type: 'event', completed: false, linkedNoteIds: [22], subtasks: [] }
        ]
    },
    {
        id: 900, title: "Hledání práce 💼", type: 'project', start: getRelativeDateStr(0), end: getRelativeDateStr(60), completed: false, linkedNoteIds: [8, 9],
        subtasks: [
            { id: 901, title: "Aktualizovat životopis", type: 'event', completed: false, subtasks: [] },
            { id: 902, title: "Upravit LinkedIn profil", type: 'event', completed: false, subtasks: [] },
            { id: 903, title: "Odeslat odpověď na inzerát Senior JS Dev", type: 'event', completed: false, subtasks: [] },
            { id: 904, title: "Připravit se na pohovor (úterý)", type: 'event', completed: false, subtasks: [] },
            { id: 905, title: "Aktualizovat portfolio na webu", type: 'event', completed: false, subtasks: [] },
            { id: 906, title: "Založit profil na Jobs.cz", type: 'event', completed: false, subtasks: [] },
            { id: 907, title: "Napsat doporučení na LinkedIn", type: 'event', completed: false, subtasks: [] },
            { id: 908, title: "Procvičit React otázky na pohovor", type: 'event', completed: false, subtasks: [] }
        ]
    },
    {
        id: 1000, title: "Nákupy 🛒", type: 'project', start: getRelativeDateStr(0), end: getRelativeDateStr(7), completed: false, linkedNoteIds: [10],
        subtasks: [
            { id: 1101, title: "Seznam pro IKEA", type: 'event', completed: false, subtasks: [] },
            { id: 1102, title: "Koupit nové žárovky do lustru", type: 'event', completed: false, subtasks: [] },
            { id: 1103, title: "Objednat granule pro psa (12kg)", type: 'event', completed: false, subtasks: [] },
            { id: 1104, title: "Vyzvednout balík na Zásilkovně", type: 'event', completed: false, subtasks: [] },
            { id: 1105, title: "Zastavit se v lékárně (Paralen)", type: 'event', completed: false, subtasks: [] },
            { id: 1106, title: "Koupit zimní směs do ostřikovačů", type: 'event', completed: false, subtasks: [] },
            { id: 1107, title: "Objednat kávu do kávovaru", type: 'event', completed: false, subtasks: [] }
        ]
    },
    {
        id: 3001,
        title: "Ranní běh - 8denní výzva 🏃‍♀️",
        type: 'event',
        activityType: 'recurring',
        intervalStart: getRelativeDateStr(0),
        intervalEnd: getRelativeDateStr(7),
        recurrencePattern: 'daily',
        recurrenceInterval: 1,
        recurrenceUnit: 'day',
        startTime: "07:00",
        endTime: "07:30",
        completed: false,
        subtasks: [],
        recurrenceInstances: Array.from({ length: 8 }).map((_, i) => ({
            id: `inst-3001-${i}`,
            date: getRelativeDateStr(i),
            originalDate: getRelativeDateStr(i),
            endDate: getRelativeDateStr(i),
            startTime: "07:00",
            endTime: "07:30",
            completed: false,
            isGenerated: true,
            isSuppressed: i === 2,
            isEdited: false,
            customTitle: null,
            subtasks: [],
            linkedNoteIds: i === 1 ? [30] : (i === 2 ? [31] : []),
            isHidden: false
        }))
    },
    {
        id: 3002,
        title: "Březnové studium (20 dní) 📚",
        type: 'event',
        activityType: 'recurring',
        intervalStart: "2026-03-01",
        intervalEnd: "2026-03-20",
        recurrencePattern: 'daily',
        recurrenceInterval: 1,
        recurrenceUnit: 'day',
        completed: false,
        subtasks: []
    },
    {
        id: 4001,
        title: "Pravidelný kurz 🎓",
        type: 'event',
        activityType: 'multi_recurring',
        intervalStart: getRelativeDateStr(0),
        intervalEnd: getRelativeDateStr(21), // Kurz na 3 týdny
        recurrencePattern: 'weekly',
        recurrenceInterval: 1,
        recurrenceUnit: 'week',
        recurrenceDays: [1, 3], // Pondělí a Středa
        recurrenceWeeks: ['odd', 'even'],
        completed: false,
        subtasks: [],
        multiDefs: [
            { startTime: "16:00", endTime: "17:30", title: "<n> - Teorie (Lekce <d>/<s>)" },
            { startTime: "17:45", endTime: "19:00", title: "<n> - Praxe (Lekce <d>/<s>)" }
        ]
    }
];