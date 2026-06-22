import { X } from "lucide-react";

import type { Id } from "../../../../../shared/types";
import { LinkedNoteTarget } from "../../../types/renderType";
import { AcitvityIcon } from "../../icons/ActivityIcon";

type NoteLinkedItemsProps = {
    items: LinkedNoteTarget[];
    onUnlink: (itemId: Id) => void;
};

export const NoteLinkedItems = ({
    items,
    onUnlink,
}: NoteLinkedItemsProps) => {
    return (
        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
            {items.map((item) => {
                let chipClass =
                    item.type === "project"
                        ? "bg-purple-50 text-purple-900 border-purple-200"
                        : "bg-blue-50 text-blue-900 border-blue-200";

                let iconClass =
                    item.type === "project"
                        ? "text-purple-600"
                        : "text-blue-600";

                if (item.isSuppressed) {
                    chipClass = "bg-slate-100 text-slate-500 border-slate-300";
                    iconClass = "text-slate-400";
                }

                return (
                    <span
                        key={item.id}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border h-auto ${chipClass}`}
                    >
                        <AcitvityIcon
                            type={item.type}
                            className={`w-3 h-3 ${iconClass} shrink-0`}
                        />

                        <span className="font-medium whitespace-normal break-words">
                            {item.title}
                        </span>

                        <button
                            type="button"
                            onClick={() => onUnlink(item.id)}
                            className="ml-1 hover:bg-black/10 rounded p-0.5"
                        >
                            <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                    </span>
                );
            })}
        </div>
    );
};