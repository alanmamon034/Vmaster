import React, { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Groups seats by section+row so seats from the same block are shown
// together, matching the real Ticketmaster "Sec X, Row Y" grouping.
function groupSeats(allSeats) {
  const groups = new Map();
  allSeats.forEach((seat, idx) => {
    const key = `${seat.section || ""}__${seat.row || ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...seat, __idx: idx });
  });
  return Array.from(groups.entries()).map(([key, seats]) => {
    const [section, row] = key.split("__");
    return { section, row, seats };
  });
}

export default function TransferSheet({ open, ticket, allSeats, onClose, onConfirm, busy }) {
  const [step, setStep] = useState("seats"); // seats | details
  const [selected, setSelected] = useState(new Set());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const onlyOneSeat = allSeats.length <= 1;

  useEffect(() => {
    if (open) {
      setSelected(onlyOneSeat ? new Set([0]) : new Set());
      setStep(onlyOneSeat ? "details" : "seats");
      setName("");
      setEmail("");
    }
  }, [open, ticket?.id]);

  if (!open) return null;

  const toggleSeat = (idx) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const grouped = groupSeats(allSeats);

  const handleConfirm = () => {
    if (!name.trim() || !email.trim()) return;
    onConfirm({
      selectedIndices: Array.from(selected),
      name: name.trim(),
      email: email.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <span className="w-6" />
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
            {step === "seats" ? "Select tickets to transfer" : "Transfer to"}
          </h2>
          <button onClick={onClose} className="p-1 text-neutral-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "seats" && (
          <>
            <div className="flex items-start gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-100">
              <Info className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-500 leading-relaxed">
                Only transfer tickets to people you know and trust to ensure everyone stays safe.
              </p>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
              {grouped.map((group, gi) => (
                <div key={gi}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-neutral-700">
                      Sec {group.section || "—"}, Row {group.row || "—"}
                    </p>
                    <p className="text-xs text-neutral-400">{group.seats.length} Tickets</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {group.seats.map((seat) => {
                      const isSelected = selected.has(seat.__idx);
                      return (
                        <button
                          key={seat.__idx}
                          type="button"
                          onClick={() => toggleSeat(seat.__idx)}
                          className={`rounded-xl border p-3 text-left transition-colors ${
                            isSelected
                              ? "bg-[#024ddf] border-[#024ddf]"
                              : "bg-white border-neutral-200"
                          }`}
                        >
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wide ${
                              isSelected ? "text-white" : "text-neutral-500"
                            }`}
                          >
                            Seat {seat.seats || "—"}
                          </p>
                          <div
                            className={`h-4 w-4 rounded-full border-2 mt-2 ${
                              isSelected
                                ? "bg-white border-white"
                                : "border-neutral-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <span className="text-sm font-semibold text-neutral-700">
                {selected.size} Selected
              </span>
              <button
                type="button"
                disabled={selected.size === 0}
                onClick={() => setStep("details")}
                className="text-sm font-bold text-[#024ddf] disabled:text-neutral-300 disabled:cursor-not-allowed"
              >
                Transfer to &gt;
              </button>
            </div>
          </>
        )}

        {step === "details" && (
          <div className="px-4 py-4 space-y-4">
            <p className="text-sm text-neutral-500">
              {ticket?.event_name} · {selected.size} ticket{selected.size === 1 ? "" : "s"}
            </p>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Recipient name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Recipient email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@email.com"
              />
            </div>
            <div className="flex gap-2 pt-2">
              {!onlyOneSeat && (
                <Button variant="ghost" onClick={() => setStep("seats")} disabled={busy}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleConfirm}
                disabled={busy || !name.trim() || !email.trim()}
                className="flex-1 bg-[#024ddf] text-white hover:bg-[#024ddf]/90"
              >
                {busy ? "Transferring…" : "Confirm transfer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
