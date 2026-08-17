import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Upload, Camera, Eye, Save, Calendar, MapPin, Ticket } from "lucide-react";
import { supabase, uploadFile } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TicketDetailCard from "@/components/TicketDetailCard";
import { useLocationSettings } from "@/lib/LocationContext";
import { format } from "date-fns";

const emptySeat = { section: "", row: "", seats: "" };

export default function AddTicket() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency, country } = useLocationSettings();
  const isSG = country.code === "SG";
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const dateInputRef = useRef(null);

  const [form, setForm] = useState({
    event_name: "",
    venue: "",
    country: "",
    ticket_type: "regular",
    delivery_method: "mobile",
    event_date: "",
    image_url: "",
    order_number: "",
    package_name: "",
    ticket_limit: "",
    main_section: "",
    main_row: "",
    main_seat: "",
    price: "",
  });
  const [seats, setSeats] = useState([{ ...emptySeat }]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const ticketCount =
    seats.filter((g) => g.section || g.row || g.seats).length ||
    (form.main_section ? 1 : 0);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      set("image_url", file_url);
      toast({ title: "Photo updated" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const addSeat = () => setSeats((s) => [...s, { ...emptySeat }]);
  const removeSeat = (i) => setSeats((s) => s.filter((_, idx) => idx !== i));
  const updateSeat = (i, k, v) =>
    setSeats((s) => s.map((seat, idx) => (idx === i ? { ...seat, [k]: v } : seat)));

  const previewTicket = {
    ...form,
    seat_groups: seats.filter((g) => g.section || g.row || g.seats),
    ticket_limit: form.ticket_limit ? Number(form.ticket_limit) : null,
    price: form.price ? Number(form.price) : null,
    status: "in_wallet",
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!form.event_name.trim()) {
      toast({ title: "Event name is required", variant: "destructive" });
      return;
    }
    const validSeats = seats.filter((g) => g.section || g.row || g.seats);
    if (validSeats.length === 0 && !form.main_section) {
      toast({ title: "Add at least one seat", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("tickets").insert({
        ...form,
        event_date: form.event_date || null,
        country: country.code,
        owner_id: user.id,
        seat_groups: validSeats,
        ticket_limit: form.ticket_limit ? Number(form.ticket_limit) : null,
        price: form.price ? Number(form.price) : null,
        status: "in_wallet",
      });
      if (error) throw error;
      toast({ title: "Ticket saved to your wallet" });
      navigate("/my-tickets");
    } catch (err) {
      toast({ title: "Failed to save ticket", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-neutral-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#024ddf]/30 focus:border-[#024ddf]";

  const labelCls = "text-[10px] font-bold text-neutral-400 tracking-widest";

  return (
    <form onSubmit={submit} className="min-h-screen bg-neutral-50 pb-8">
      <header className="sticky top-0 z-40 bg-black text-white px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold">Add Ticket</h1>
      </header>

      {/* Event header — uploaded photo as background, details floating in front */}
      <div className="relative w-full aspect-[16/10] bg-neutral-900">
        {form.image_url ? (
          <Image src={form.image_url} fittingType="fill" className="absolute inset-0 h-full w-full" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45" />
        <div className="relative flex flex-col justify-end p-5 h-full">
          <button
            type="button"
            onClick={() => {
              const el = dateInputRef.current;
              if (!el) return;
              if (typeof el.showPicker === "function") {
                el.showPicker();
              } else {
                el.focus();
                el.click();
              }
            }}
            className="flex items-center gap-2 mb-2 w-fit"
          >
            <Calendar className="h-4 w-4 text-white/85 shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">
              {form.event_date
                ? format(new Date(form.event_date), "EEE MMM d, yyyy")
                : "Add date"}
            </span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={form.event_date}
            onChange={(e) => set("event_date", e.target.value)}
            className="sr-only"
          />
          <input
            value={form.event_name}
            onChange={(e) => set("event_name", e.target.value)}
            placeholder="Event name"
            className="w-full bg-transparent text-2xl font-black leading-tight text-white placeholder:text-white/45 focus:outline-none"
          />
          <div className="relative mt-2">
            <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/80" />
            <input
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Venue"
              className="w-full bg-transparent pl-6 text-sm font-semibold text-white/90 placeholder:text-white/45 focus:outline-none"
            />
          </div>
          <p className="text-xs font-semibold text-white/65 mt-1 uppercase tracking-wide">
            {country.flag} {country.name}
          </p>
          {ticketCount > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              <Ticket className="h-4 w-4 text-white/90" />
              <span className="text-xs font-bold text-white">x {ticketCount} tickets</span>
            </div>
          )}
        </div>
      </div>

      {/* Main ticket card */}
      <div className="px-3 pt-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200/60 space-y-4">
          {isSG && (
            <div>
              <p className={labelCls}>TICKET TYPE</p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => set("ticket_type", "regular")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                    form.ticket_type === "regular"
                      ? "bg-[#024ddf] text-white border-[#024ddf]"
                      : "bg-white text-neutral-600 border-neutral-200"
                  }`}
                >
                  Regular
                </button>
                <button
                  type="button"
                  onClick={() => set("ticket_type", "vip")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                    form.ticket_type === "vip"
                      ? "bg-[#024ddf] text-white border-[#024ddf]"
                      : "bg-white text-neutral-600 border-neutral-200"
                  }`}
                >
                  VIP
                </button>
              </div>
              {form.ticket_type === "vip" && (
                <p className="text-xs text-neutral-400 mt-1.5">
                  VIP tickets can't be transferred or sold once saved.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className={labelCls}>SECTION</p>
              <input
                value={form.main_section}
                onChange={(e) => set("main_section", e.target.value)}
                placeholder="PC3"
                className={inputCls}
              />
            </div>
            <div>
              <p className={labelCls}>ROW</p>
              <input
                value={form.main_row}
                onChange={(e) => set("main_row", e.target.value)}
                placeholder="4"
                className={inputCls}
              />
            </div>
            <div>
              <p className={labelCls}>SEAT</p>
              <input
                value={form.main_seat}
                onChange={(e) => set("main_seat", e.target.value)}
                placeholder="440"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <p className={labelCls}>DELIVERY METHOD</p>
            <select
              value={form.delivery_method}
              onChange={(e) => set("delivery_method", e.target.value)}
              className={inputCls}
            >
              <option value="mobile">Mobile Ticket</option>
              <option value="print_at_home">Print-At-Home</option>
              <option value="venue_collection">Venue Collection</option>
              <option value="courier">Courier Delivery</option>
            </select>
          </div>

          <div>
            <p className={labelCls}>ORDER #</p>
            <input
              value={form.order_number}
              onChange={(e) => set("order_number", e.target.value)}
              placeholder="50-3567765AG2"
              className={inputCls}
            />
          </div>

          <div>
            <p className={labelCls}>PACKAGE NAME</p>
            <input
              value={form.package_name}
              onChange={(e) => set("package_name", e.target.value)}
              placeholder="SOUNDCHECK VIP PACKAGE"
              className={inputCls}
            />
          </div>

          <div>
            <p className={labelCls}>TICKET LIMIT PER PERSON</p>
            <input
              type="number"
              value={form.ticket_limit}
              onChange={(e) => set("ticket_limit", e.target.value)}
              placeholder="4"
              className={inputCls}
            />
            <p className="text-xs text-neutral-400 mt-1">4-ticket limit per person on this event</p>
          </div>

          <div>
            <p className={labelCls}>PRICE PAID ({currency.symbol})</p>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Individual seats */}
      <div className="px-3 pt-5">
        <p className="text-sm font-bold text-neutral-900">Individual seats</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          Optional — shown to the buyer as a per-ticket breakdown
        </p>

        <div className="mt-3 space-y-3">
          {seats.map((seat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-400">Seat {i + 1}</span>
                {seats.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSeat(i)}
                    className="text-xs font-bold text-[#024ddf] active:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className={labelCls}>SECTION</p>
                  <input
                    value={seat.section}
                    onChange={(e) => updateSeat(i, "section", e.target.value)}
                    placeholder="PC3"
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className={labelCls}>ROW</p>
                  <input
                    value={seat.row}
                    onChange={(e) => updateSeat(i, "row", e.target.value)}
                    placeholder="5"
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className={labelCls}>SEAT</p>
                  <input
                    value={seat.seats}
                    onChange={(e) => updateSeat(i, "seats", e.target.value)}
                    placeholder="23"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addSeat}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#024ddf]/40 text-[#024ddf] font-bold text-sm active:bg-[#024ddf]/5 transition-colors"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} /> Add another seat
        </button>
      </div>

      {/* Photo */}
      <div className="px-3 pt-5">
        <p className="text-sm font-bold text-neutral-900 mb-2">Event photo</p>
        {form.image_url ? (
          <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-neutral-100">
            <Image src={form.image_url} fittingType="fill" className="h-full w-full" />
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center aspect-[16/10] rounded-xl border-2 border-dashed border-neutral-300 cursor-pointer hover:border-[#024ddf] transition-colors">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-neutral-200 border-t-[#024ddf] rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="h-7 w-7 text-neutral-400 mb-2" />
                <span className="text-sm font-semibold text-neutral-600">Add a photo</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
          </label>
        )}

        <div className="flex gap-2 mt-3">
          <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-300 text-sm font-bold text-neutral-700 active:bg-neutral-100 transition-colors cursor-pointer">
            <Camera className="h-4 w-4" />
            {form.image_url ? "Change photo" : "Add photo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
          </label>
          {form.image_url && (
            <button
              type="button"
              onClick={() => set("image_url", "")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-300 text-sm font-bold text-red-500 active:bg-red-50 transition-colors"
            >
              <X className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-3 pt-6 space-y-3">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#024ddf] text-[#024ddf] font-bold text-sm active:bg-[#024ddf]/5 transition-colors"
        >
          <Eye className="h-5 w-5" /> Ticket preview
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#024ddf] text-white font-bold text-base shadow-lg shadow-blue-500/25 disabled:opacity-60 active:scale-[0.98] transition-all"
        >
          <Save className="h-5 w-5" /> {submitting ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Ticket preview</DialogTitle>
          </DialogHeader>
          <div className="pb-2">
            <TicketDetailCard
              ticket={previewTicket}
              onTransfer={() => {}}
              onSell={() => {}}
              onRemoveListing={() => {}}
            />
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
