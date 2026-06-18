import { Check, GripVertical, Repeat, X } from "lucide-react";

import type { Id } from "../../../../shared/types";
import { EventActionBar } from "./EventActionBar";
import { EventActions } from "./eventCardTypes";

type EventHeaderItem = {
	id: Id;
	title: string;
	completed: boolean;
	isInstance?: boolean;
	isHidden?: boolean;
	isGenerated?: boolean;
};

type EventHeaderProps = {
	item: EventHeaderItem;
	timeLabel: string;
	isBeingDragged: boolean;
	isSortEnabled: boolean;
	actions: EventActions;
};

export const EventHeader = ({
	item,
	timeLabel,
	isBeingDragged,
	isSortEnabled,
	actions,
}: EventHeaderProps) => {
	const handleDragHandleClick = (
		event: React.MouseEvent<HTMLDivElement>
	) => {
		event.stopPropagation();
	};

	return (
		<div className="flex items-center px-2 py-1 gap-3 min-h-[36px] group">
			{isSortEnabled && (
				<div
					className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 -ml-1 shrink-0"
					onClick={handleDragHandleClick}
				>
					<GripVertical className="w-4 h-4" />
				</div>
			)}

			<button
				type="button"
				onClick={(event) => actions.toggleStatus(event, item.id)}
				className="w-[22px] h-[22px] bg-white border border-blue-200 rounded flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
			>
				{item.completed ? (
					<Check
						className="w-3.5 h-3.5 text-green-600"
						strokeWidth={3}
					/>
				) : (
					<X
						className="w-3.5 h-3.5 text-red-500"
						strokeWidth={3}
					/>
				)}
			</button>

			<div className="flex-1 flex flex-row items-center gap-x-2 min-w-0">
				{item.isInstance && (
					<Repeat className="w-3 h-3 text-blue-400 shrink-0" />
				)}

				{timeLabel && (
					<div className="w-[300px] shrink-0">
						<span
							className={`text-xs font-mono whitespace-nowrap ${isBeingDragged
								? "text-white/80"
								: "text-slate-500"
								}`}
						>
							{timeLabel}
						</span>
					</div>
				)}

				<span
					className={`font-bold text-xs break-words leading-tight ${isBeingDragged ? "text-white" : "text-black"
						}`}
				>
					{item.title}
				</span>
			</div>

			<EventActionBar item={item} actions={actions} />
		</div>
	);
};