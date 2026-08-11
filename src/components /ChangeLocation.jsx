import React from "react";
import { Check, X } from "lucide-react";
import { useLocationSettings } from "@/lib/LocationContext";

export default function ChangeLocation({ open, onClose }) {
  const { countries, code, setCode } = useLocationSettings();
  if (!open) return null;

  const select = (c) => {
    setCode(c.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl max-h-[80vh] flex flex-col animate-[slideUp_0.2s_ease-out]">
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1.5 w-10 rounded-full bg-neutral-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-100">
          <span className="w-6" />
          <h2 className="text-base font-bold text-neutral-900">Change Location</h2>
          <button onClick={onClose} className="p-1 text-neutral-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto">
          {countries.map((c) => {
            const selected = c.code === code;
            return (
              <button
                key={c.code}
                onClick={() => select(c)}
                className={`relative w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-neutral-100 ${
                  selected ? "bg-neutral-100" : "bg-white"
                }`}
              >
                {selected && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#0056D2]" />
                )}
                <span className="h-8 w-8 rounded-full overflow-hidden border border-neutral-200 flex items-center justify-center text-lg shrink-0 bg-white">
                  {c.flag}
                </span>
                <span className="flex-1 text-sm font-semibold text-neutral-900">
                  {c.name}
                </span>
                {selected && <Check className="h-5 w-5 text-neutral-900" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
