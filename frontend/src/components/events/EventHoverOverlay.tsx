import {
	ArrowRightCircle,
	Copy as CopyIcon,
	CornerDownRight,
	CornerLeftUp,
	Link as LinkIcon,
} from "lucide-react";
import { EventHoverZone } from "./eventCardTypes";

type EventHoverOverlayProps = {
	hoverZone: EventHoverZone;
};

export const EventHoverOverlay = ({ hoverZone }: EventHoverOverlayProps) => {
	if (hoverZone === "note_move") {
		return (
			<div className="absolute left-1/2 top-2 -translate-x-1/2 flex items-center gap-2 pointer-events-none text-sky-800 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/95 px-3 py-1 rounded shadow-md border border-sky-200 text-xs font-bold uppercase">
				<ArrowRightCircle className="w-4 h-4" />
				<span>Přesunout k aktivitě</span>
			</div>
		);
	}

	if (hoverZone === "note_link") {
		return (
			<div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none text-yellow-800 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/95 px-3 py-1 rounded shadow-md border border-yellow-200 text-xs font-bold uppercase">
				<LinkIcon className="w-4 h-4" />
				<span>Připojit k aktivitě</span>
			</div>
		);
	}

	if (hoverZone === "note_copy") {
		return (
			<div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex items-center gap-2 pointer-events-none text-orange-800 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/95 px-3 py-1 rounded shadow-md border border-orange-200 text-xs font-bold uppercase">
				<CopyIcon className="w-4 h-4" />
				<span>Vytvořit kopii a připojit</span>
			</div>
		);
	}

	if (hoverZone === "makeParent") {
		return (
			<div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-purple-700 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/90 px-2 py-1 rounded shadow-sm border border-purple-200 text-[10px] font-bold uppercase">
				<CornerLeftUp className="w-3 h-3" />
				<span>Nadřadit</span>
			</div>
		);
	}

	if (hoverZone === "indent") {
		return (
			<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-green-700 animate-in fade-in zoom-in-95 duration-200 z-50 bg-white/90 px-2 py-1 rounded shadow-sm border border-green-200 text-[10px] font-bold uppercase">
				<span>Vnořit</span>
				<CornerDownRight className="w-3 h-3" />
			</div>
		);
	}

	return null;
};