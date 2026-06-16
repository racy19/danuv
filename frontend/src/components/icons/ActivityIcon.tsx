import {
	Calendar as CalendarIcon,
	Folder,
	ListTodo,
	StickyNote,
} from "lucide-react";

type AcitvityIconProps = {
	type: string;
	className?: string;
};

export const AcitvityIcon = ({ type, className }: AcitvityIconProps) => {
	switch (type) {
		case "note":
			return <StickyNote className={className} />;
		case "task":
			return <ListTodo className={className} />;
		case "project":
			return <Folder className={className} />;
		default:
			return <CalendarIcon className={className} />;
	}
};