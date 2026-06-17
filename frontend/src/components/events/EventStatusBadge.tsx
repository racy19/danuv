type EventStatusBadgeProps = {
	isToday: boolean;
	isOverdue: boolean;
};

export const EventStatusBadge = ({
	isToday,
	isOverdue,
}: EventStatusBadgeProps) => {
	if (!isOverdue && !isToday) {
		return null;
	}

	return (
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
	);
};