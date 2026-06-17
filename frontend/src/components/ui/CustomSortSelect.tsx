import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SelectOption<T extends string = string> = {
	value: T;
	label: string;
};

type CustomSortSelectProps<T extends string = string> = {
	value: T;
	onChange: (value: T) => void;
	options: readonly SelectOption<T>[];
};

export const CustomSortSelect = <T extends string = string>({
	value,
	onChange,
	options,
}: CustomSortSelectProps<T>) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedOption =
		options.find((option) => option.value === value) ?? options[0];

	const handleToggle = () => {
		setIsOpen((current) => !current);
	};

	const handleSelect = (selectedValue: T) => {
		onChange(selectedValue);
		setIsOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (
				containerRef.current &&
				!containerRef.current.contains(target)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	if (!selectedOption) {
		return null;
	}

	return (
		<div className="relative w-full" ref={containerRef}>
			<button
				type="button"
				onClick={handleToggle}
				className="w-full bg-slate-50 border border-slate-300 text-slate-700 py-2.5 px-3 rounded flex items-center justify-between hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors text-sm shadow-sm"
			>
				<span className="truncate">{selectedOption.label}</span>

				<ChevronDown
					className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
						}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute z-[100] left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-[350px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
					{options.map((option) => {
						const isSelected = value === option.value;

						return (
							<button
								key={option.value}
								type="button"
								onClick={() => handleSelect(option.value)}
								className={`w-full px-3 py-2 text-sm text-left flex items-center transition-colors border-b border-slate-50 last:border-0 ${isSelected
									? "bg-teal-50 text-teal-800 font-medium"
									: "text-slate-700 hover:bg-slate-50"
									}`}
							>
								<span className="truncate w-full">
									{option.label}
								</span>

								{isSelected && (
									<Check className="w-3.5 h-3.5 text-teal-600 ml-2 shrink-0" />
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};