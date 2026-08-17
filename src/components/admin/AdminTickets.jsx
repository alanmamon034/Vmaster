import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase, uploadFile } from "@/api/supabaseClient";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { useLocationSettings } from "@/lib/LocationContext";

const statuses = ["in_wallet", "listed_for_sale", "transferred", "sold"];

const empty = {
  event_name: "",
  venue: "",
  country: "",
  ticket_type: "regular",
  delivery_method: "mobile",
  extras: [],
  event_date: "",
  image_url: "",
  order_number: "",
  package_name: "",
  ticket_limit: "",
  main_section: "",
  main_row: "",
  main_seat: "",
  price: "",
  status: "in_wallet",
};

const emptySeat = { section: "", row: "", seats: "" };

const fieldCls =
  "w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30";
const labelCls = "text-[10px] font-bold text-neutral-400 tracking-widest";

export default function AdminTickets() {
  const { toast } = useToast();
  const { currency } = useLocationSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [seats, setSeats] = useState([{ ...emptySeat }]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const list = data;
      setItems(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      set("image_url", file_url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    setEditing("new");
    setForm(empty);
    setSeats([{ ...emptySeat }]);
  };
  const openEdit = (t) => {
    setEditing(t.id);
    setForm({
      ...empty,
      ...t,
      ticket_limit: t.ticket_limit ?? "",
      price: t.price ?? "",
    });
    setSeats((t.seat_groups && t.seat_groups.length ? t.seat_groups : [{ ...emptySeat }]));
  };
  const close = () => setEditing(null);

  const addSeat = () => setSeats((s) => [...s, { ...emptySeat }]);
  const removeSeat = (i) => setSeats((s) => s.filter((_, idx) => idx !== i));
  const updateSeat = (i, k, v) =>
    setSeats((s) => s.map((seat, idx) => (idx === i ? { ...seat, [k]: v } : seat)));

  const setTicketCount = (n) => {
    const count = Math.max(1, Number(n) || 1);
    setSeats((s) => {
      const next = [...s];
      while (next.length < count) next.push({ ...emptySeat });
      next.length = count;
      return next;
    });
  };

  const save = async () => {
    if (!form.event_name.trim()) {
      toast({ title: "Event name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const validSeats = seats.filter((g) => g.section || g.row || g.seats);
      const payload = {
        ...form,
        seat_groups: validSeats,
        ticket_limit: form.ticket_limit ? Number(form.ticket_limit) : null,
        price: form.price ? Number(form.price) : null,
      };
      if (editing === "new") {
        const { error } = await supabase.from("tickets").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tickets").update(payload).eq("id", editing);
        if (error) throw error;
      }
      toast({ title: "Ticket saved" });
      setEditing(null);
      load();
    } catch (e) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t) => {
    if (!confirm(`Delete this ticket for "${t.event_name}"?`)) return;
    try {
      const { error } = await supabase.from("tickets").delete().eq("id", t.id);
      if (error) throw error;
      toast({ title: "Ticket deleted" });
      load();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="px-4">
      <button
        onClick={openNew}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563eb] text-white font-bold text-sm mb-4 active:scale-95 transition"
      >
        <Plus className="h-5 w-5" /> Add ticket
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-neutral-200 border-t-[#2563eb] rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-neutral-400 py-10">No tickets yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-neutral-200/60"
            >
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                {t.image_url ? (
                  <Image src={t.image_url} fittingType="fill" className="h-full w-full" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900 line-clamp-1">{t.event_name}</p>
                <p className="text-xs text-neutral-500 line-clamp-1">
                  {t.main_section} {t.main_row}/{t.main_seat} · {t.status}
                </p>
              </div>
              <button onClick={() => openEdit(t)} className="p-2 text-neutral-500 active:scale-90">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(t)} className="p-2 text-red-500 active:scale-90">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
              <h3 className="font-bold text-neutral-900">
                {editing === "new" ? "Add ticket" : "Edit ticket"}
              </h3>
              <button onClick={close} className="p-1">
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <p className={labelCls}>EVENT NAME</p>
                <input value={form.event_name} onChange={(e) => set("event_name", e.target.value)} className={fieldCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={labelCls}>VENUE</p>
                  <input value={form.venue} onChange={(e) => set("venue", e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <p className={labelCls}>COUNTRY</p>
                  <input value={form.country} onChange={(e) => set("country", e.target.value)} className={fieldCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={labelCls}>DATE</p>
                  <input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <p className={labelCls}>STATUS</p>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={fieldCls}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className={labelCls}>SECTION</p>
                  <input value={form.main_section} onChange={(e) => set("main_section", e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <p className={labelCls}>ROW</p>
                  <input value={form.main_row} onChange={(e) => set("main_row", e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <p className={labelCls}>SEAT</p>
                  <input value={form.main_seat} onChange={(e) => set("main_seat", e.target.value)} className={fieldCls} />
                </div>
              </div>
              <div>
                <p className={labelCls}>DELIVERY METHOD</p>
                <select value={form.delivery_method} onChange={(e) => set("delivery_method", e.target.value)} className={fieldCls}>
                  <option value="mobile">Mobile Ticket</option>
                  <option value="print_at_home">Print-At-Home</option>
                  <option value="venue_collection">Venue Collection</option>
                  <option value="courier">Courier Delivery</option>
                </select>
              </div>
              <div>
                <p className={labelCls}>EXTRAS (one per line)</p>
                <textarea
                  value={(form.extras || []).join("\n")}
                  onChange={(e) => set("extras", e.target.value.split("\n").filter(Boolean))}
                  rows={3}
                  placeholder={"Early entry\nMerch item\nMeet & Greet"}
                  className={fieldCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={labelCls}>ORDER #</p>
                  <input value={form.order_number} onChange={(e) => set("order_number", e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <p className={labelCls}>NO. OF TICKETS</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTicketCount(seats.length - 1)}
                      className="h-9 w-9 shrink-0 rounded-lg border border-neutral-300 text-lg font-bold text-neutral-600 active:bg-neutral-100"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={seats.length}
                      onChange={(e) => setTicketCount(e.target.value)}
                      className={fieldCls + " text-center"}
                    />
                    <button
                      type="button"
                      onClick={() => setTicketCount(seats.length + 1)}
                      className="h-9 w-9 shrink-0 rounded-lg border border-neutral-300 text-lg font-bold text-neutral-600 active:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              {(form.country || "").toUpperCase().includes("SG") ||
              (form.country || "").toLowerCase().includes("singapore") ? (
                <div>
                  <p className={labelCls}>TICKET TYPE</p>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => set("ticket_type", "regular")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        form.ticket_type === "regular"
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-white text-neutral-600 border-neutral-200"
                      }`}
                    >
                      Regular
                    </button>
                    <button
                      type="button"
                      onClick={() => set("ticket_type", "vip")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        form.ticket_type === "vip"
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-white text-neutral-600 border-neutral-200"
                      }`}
                    >
                      VIP
                    </button>
                  </div>
                </div>
              ) : null}
              <div>
                <p className={labelCls}>TICKET LIMIT PER PERSON</p>
                <input type="number" value={form.ticket_limit} onChange={(e) => set("ticket_limit", e.target.value)} className={fieldCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={labelCls}>PACKAGE NAME</p>
                  <input value={form.package_name} onChange={(e) => set("package_name", e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <p className={labelCls}>PRICE ({currency.symbol})</p>
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className={fieldCls} />
                </div>
              </div>

              <div>
                <p className={labelCls}>INDIVIDUAL SEATS</p>
                <div className="space-y-2">
                  {seats.map((seat, i) => (
                    <div key={i} className="rounded-lg border border-neutral-200 p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-400 tracking-widest">
                          TICKET {i + 1}
                        </span>
                        {seats.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSeat(i)}
                            className="text-[11px] font-bold text-[#2563eb]"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input value={seat.section} onChange={(e) => updateSeat(i, "section", e.target.value)} placeholder="Section" className={fieldCls} />
                        <input value={seat.row} onChange={(e) => updateSeat(i, "row", e.target.value)} placeholder="Row" className={fieldCls} />
                        <input value={seat.seats} onChange={(e) => updateSeat(i, "seats", e.target.value)} placeholder="Seat" className={fieldCls} />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addSeat} className="mt-2 text-xs font-bold text-[#2563eb] flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Add seat
                </button>
              </div>

              <div>
                <p className={labelCls}>IMAGE</p>
                {form.image_url ? (
                  <div className="relative rounded-lg overflow-hidden aspect-[16/9] bg-neutral-100 mb-2">
                    <Image src={form.image_url} fittingType="fill" className="h-full w-full" />
                  </div>
                ) : null}
                <label className="block text-center py-2 rounded-lg border border-dashed border-neutral-300 text-xs font-bold text-[#2563eb] cursor-pointer">
                  {uploading ? "Uploading…" : "Upload image"}
                  <input type="file" accept="image/*" className="hidden" onChange={onImage} disabled={uploading} />
                </label>
              </div>

            </div>
            <div className="p-4 border-t border-neutral-100 shrink-0">
              <button
                onClick={save}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-[#2563eb] text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition"
              >
                {saving ? "Saving…" : "Save ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
