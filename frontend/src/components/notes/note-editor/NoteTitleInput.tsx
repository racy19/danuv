import type { RefObject } from "react";

type NoteTitleInputProps = {
    value: string;
    onChange: (value: string) => void;
    inputRef?: RefObject<HTMLTextAreaElement | null>;
};

export const NoteTitleInput = ({
    value,
    onChange,
    inputRef,
}: NoteTitleInputProps) => {
    const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
        const textarea = event.currentTarget;

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight + 2}px`;
    };

    return (
        <div className="bg-transparent px-4 pt-4 pb-4 shrink-0 border-b border-yellow-200 flex items-start gap-3">
            <textarea
                ref={inputRef}
                rows={1}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onInput={handleInput}
                className="font-bold text-xl bg-transparent border-transparent focus:border-yellow-300 rounded px-2 py-1 focus:outline-none w-full text-yellow-900 placeholder:text-yellow-700/50 resize-none overflow-hidden"
                placeholder="Název poznámky..."
                style={{ minHeight: "2.5rem" }}
            />
        </div>
    );
};