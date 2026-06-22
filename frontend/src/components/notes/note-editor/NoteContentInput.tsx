type NoteContentProps = {
    value: string;
    onChange: (value: string) => void;
};

export const NoteContentInput = ({
    value,
    onChange,
}: NoteContentProps) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 bg-white/50 min-h-[200px]">
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full h-full min-h-[150px] bg-transparent border-none focus:outline-none text-slate-800 placeholder:text-slate-400 resize-none"
                placeholder="Sem napište text poznámky..."
            />
        </div>
    );
};