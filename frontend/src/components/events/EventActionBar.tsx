import {
	CalendarPlus,
	Eye,
	EyeOff,
	StickyNote,
	Trash2,
} from "lucide-react";

import type { Id } from "../../../../shared/types";

type EventActionItem = {
	id: Id;
	isHidden?: boolean;
	isGenerated?: boolean;
};

type EventActions = {
	createActivityForActivity: (
		event: React.MouseEvent<HTMLButtonElement>,
		itemId: Id
	) => void;
	createNoteForActivity: (
		event: React.MouseEvent<HTMLButtonElement>,
		itemId: Id
	) => void;
	toggleHide: (
		event: React.MouseEvent<HTMLButtonElement>,
		itemId: Id
	) => void;
	deleteEvent: (
		event: React.MouseEvent<HTMLButtonElement>,
		itemId: Id
	) => void;
};

type EventActionBarProps = {
	item: EventActionItem;
	actions: EventActions;
};

export const EventActionBar = ({ item, actions }: EventActionBarProps) => {
	const handleContainerClick = (
		event: React.MouseEvent<HTMLDivElement>
	) => {
		event.stopPropagation();
	};

	return (
		<div
			className="absolute right-2 top-0.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 backdrop-blur-sm p-0.5 rounded border border-blue-200 shadow-sm z-20"
			onClick={handleContainerClick}
		>
			<button
				type="button"
				onClick={(event) =>
					actions.createActivityForActivity(event, item.id)
				}
				className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
				title="Připojit novou aktivitu (podúkol)"
			>
				<CalendarPlus className="w-3.5 h-3.5" />
			</button>

			<button
				type="button"
				onClick={(event) =>
					actions.createNoteForActivity(event, item.id)
				}
				className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
				title="Připojit novou poznámku"
			>
				<StickyNote className="w-3.5 h-3.5" />
			</button>

			<button
				type="button"
				onClick={(event) => actions.toggleHide(event, item.id)}
				className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
				title={item.isHidden ? "Zobrazit" : "Skrýt"}
			>
				{item.isHidden ? (
					<Eye className="w-3.5 h-3.5" />
				) : (
					<EyeOff className="w-3.5 h-3.5" />
				)}
			</button>

			<button
				type="button"
				onClick={(event) => actions.deleteEvent(event, item.id)}
				className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
				title={item.isGenerated ? "Potlačit výskyt" : "Smazat"}
			>
				<Trash2 className="w-3.5 h-3.5" />
			</button>
		</div>
	);
};