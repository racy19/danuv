type NoteContentProps = {
	title: string;
	content?: string;
	isHeading: boolean;
};

export const NoteContent = ({ title, content, isHeading }: NoteContentProps) => {
	const hasContent = !isHeading && content && content.trim() !== "";

	return (
		<div className="flex-1 flex flex-col min-w-0 pt-0.5">
			<span className="font-bold text-xs break-words leading-tight text-yellow-900">
				{title}
			</span>

			{hasContent && (
				<div className="text-xs text-yellow-800 mt-1 whitespace-pre-wrap leading-relaxed pb-1">
					{content}
				</div>
			)}
		</div>
	);
};