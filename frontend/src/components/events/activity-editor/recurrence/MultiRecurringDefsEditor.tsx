import type { RefObject } from "react";
import { HelpCircle, Info, Plus, Trash2 } from "lucide-react";

import type { MultiRecurringDefinition } from "../../../../../../shared/types";

type MultiRecurringDefsEditorProps = {
  defs: MultiRecurringDefinition[];
  showNameHelp: boolean;
  nameHelpRef?: RefObject<HTMLDivElement | null>;

  onDefsChange: (defs: MultiRecurringDefinition[]) => void;
  onShowNameHelpChange: (show: boolean) => void;
};

export const MultiRecurringDefsEditor = ({
  defs,
  showNameHelp,
  nameHelpRef,
  onDefsChange,
  onShowNameHelpChange,
}: MultiRecurringDefsEditorProps) => {
  const updateDef = (
    index: number,
    changes: Partial<MultiRecurringDefinition>
  ) => {
    const next = defs.map((def, defIndex) =>
      defIndex === index ? { ...def, ...changes } : def
    );

    onDefsChange(next);
  };

  const removeDef = (index: number) => {
    onDefsChange(defs.filter((_, defIndex) => defIndex !== index));
  };

  const addDef = () => {
    onDefsChange([...defs, { startTime: "", endTime: "", title: "" }]);
  };

  return (
    <div className="flex flex-col w-full px-5 py-3 border-t border-blue-200 bg-white/30">
      <div className="flex flex-col gap-3">
        {defs.length > 0 ? (
          defs.map((def, defIdx) => (
            <div
              key={defIdx}
              className="flex items-end gap-2 animate-in fade-in slide-in-from-left-1 duration-200"
            >
              <div className="flex flex-col gap-1 shrink-0">
                {defIdx === 0 && (
                  <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide pl-0.5">
                    Čas začátku a konce
                  </label>
                )}

                <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 h-[34px] shadow-sm shrink-0">
                  <input
                    type="time"
                    value={def.startTime || ""}
                    onChange={(event) =>
                      updateDef(defIdx, {
                        startTime: event.target.value,
                      })
                    }
                    className="bg-transparent text-sm font-bold text-blue-900 focus:outline-none w-[70px]"
                  />

                  <span className="text-blue-300 text-xs">
                    -
                  </span>

                  <input
                    type="time"
                    value={def.endTime || ""}
                    onChange={(event) =>
                      updateDef(defIdx, {
                        endTime: event.target.value,
                      })
                    }
                    className="bg-transparent text-sm font-bold text-blue-900 focus:outline-none w-[70px]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1 min-w-0">
                {defIdx === 0 && (
                  <div className="flex items-center gap-2 pl-0.5">
                    <label className="text-[10px] font-bold text-blue-800 uppercase tracking-wide leading-none m-0">
                      Název aktivity
                    </label>

                    <div
                      className="relative"
                      ref={nameHelpRef}
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onShowNameHelpChange(
                            !showNameHelp
                          );
                        }}
                        className="text-blue-400 hover:text-blue-600 transition-colors cursor-pointer flex items-center -mt-0.5"
                        title="Nápověda ke kódům v názvu"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      {showNameHelp && (
                        <div className="absolute left-0 top-full mt-2 w-64 bg-slate-800 text-white p-3 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 text-xs leading-relaxed border border-slate-700 normal-case tracking-normal">
                          <div className="font-bold mb-2 text-blue-300 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Automatické číslování
                          </div>

                          <p className="mb-2">
                            V názvu můžete použít
                            tyto kódy pro
                            automatické doplnění
                            čísel:
                          </p>

                          <ul className="space-y-2">
                            <li>
                              <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">
                                {"<d>"}
                              </code>
                              <span className="ml-1">
                                — Aktuální
                                pořadové číslo
                                dne.
                              </span>
                            </li>

                            <li>
                              <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">
                                {"<s>"}
                              </code>
                              <span className="ml-1">
                                — Celkový počet
                                naplánovaných
                                dní.
                              </span>
                            </li>

                            <li>
                              <code className="bg-slate-700 px-1 rounded text-yellow-400 font-bold">
                                {"<n>"}
                              </code>
                              <span className="ml-1">
                                — Název skupiny
                                / hlavní
                                aktivity.
                              </span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Např. Matematika, Trénink..."
                  value={def.title || ""}
                  onChange={(event) =>
                    updateDef(defIdx, {
                      title: event.target.value,
                    })
                  }
                  className={`w-full border rounded px-3 h-[34px] text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none shadow-sm transition-colors ${!(def.title && def.title.trim())
                      ? "bg-red-50 border-red-300"
                      : "bg-white border-blue-200"
                    }`}
                />
              </div>

              {defs.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeDef(defIdx)}
                  title="Smazat položku"
                  className="w-8 h-[34px] flex items-center justify-center rounded transition-colors shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-8 h-[34px] shrink-0" />
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-blue-100 rounded-lg text-xs text-blue-400 italic">
            Zatím nejsou přidány žádné položky rozvrhu.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <div className="flex-1 flex justify-end">
          <button
            type="button"
            onClick={addDef}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Přidat aktivitu
          </button>
        </div>

        <div className="w-8 shrink-0" />
      </div>
    </div>
  );
};