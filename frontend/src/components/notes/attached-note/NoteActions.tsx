import { Trash2, Unlink } from "lucide-react";

type NoteActionsProps = {
	onUnlink: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
	onDelete: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const NoteActions = ({ onUnlink, onDelete }: NoteActionsProps) => (
	<div className="absolute right-2 top-0.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-50 backdrop-blur-sm p-0.5 rounded border border-yellow-200 shadow-sm z-20">
		<button
			type="button"
			onClick={onUnlink}
			className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
			title="Odpojit"
		>
			<Unlink className="w-3.5 h-3.5" />
		</button>

		<button
			type="button"
			onClick={onDelete}
			className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
			title="Smazat"
		>
			<Trash2 className="w-3.5 h-3.5" />
		</button>
	</div>
);