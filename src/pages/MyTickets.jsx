import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, ScanLine, Send, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { useLocationSettings } from "@/lib/LocationContext";

const statusMeta = {
  in_wallet: { label: "In Wallet", color: "bg-green-500/20 text-green-300" },
  listed_for_sale: { label: "Listed for Sale", color: "bg-amber-500/20 text-amber-300" },
  transferred: { label: "Transferred", color: "bg-blue-500/20 text-blue-300" },
  sold: { label: "Sold", color: "bg-white/10 text-neutral-300" },
};

export default function TicketDetailCard({ ticket, onTransfer, onSell, onRemoveListing }) {
  const navigate = useNavigate();
  const { currency } = useLocationSettings();
  const [tab, setTab] = useState("tickets");
  const [open, setOpen] = useState(true);

  const dateLabel = ticket.event_date
    ? format(new Date(ticket.event_date), "EEE MMM d, yyyy").toUpperCase()
    : "DATE TBC";

  const allSeats =
    (ticket.seat_groups || []).length > 0
      ? ticket.seat_groups
      : ticket.main_section || ticket.main_row || ticket.main_seat
      ? [{ section: ticket.main_section, row: ticket.main_row, seats: ticket.main_seat }]
      : [];

  const seatCount = allSeats.reduce(
    (sum, g) => sum + (g.seats ? String(g.seats).split(",").filter(Boolean).length : 1),
    0
  );

  const meta = statusMeta[ticket.status] || statusMeta.in_wallet;
  const isVipPackage = !!ticket.package_name;
  const canAct = ticket.status === "in_wallet" && !isVipPackage;

  return (
    <div className="bg-neutral-100">
      <div className="relative aspect-[4/3] bg-neutral-800">
        {ticket.image_url ? (
          <Image
            src={ticket.image_url}
            fittingType="fill"
            className="h-full w-full grayscale"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <button className="text-white text-sm font-semibold">Help</button>
        </div>
      </div>

      <div className="bg-black text-white px-5 pt-5 pb-4 -mt-6 relative z-10 mx-3 rounded-t-2xl">
        <p className="text-[11px] font-medium text-white/70 tracking-wide">{dateLabel} 7:00 PM</p>
        <h2 className="text-xl font-black leading-tight mt-1">{ticket.event_name}</h2>
        <div className="flex items-end justify-between mt-2">
          <p className="text-xs font-medium text-white/70 flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border border-white/50" />
            {ticket.venue || "Venue TBC"}
          </p>
          <span className="text-xs font-semibold text-white/70">x {seatCount} tickets</span>
        </div>

        <span className={cn("inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded", meta.color)}>
          {meta.label}
        </span>
      </div>

      <div className="mx-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full bg-[#024ddf] text-white py-3.5 rounded-b-2xl flex items-center justify-center gap-2 font-bold text-sm active:bg-[#023bb8] transition-colors"
        >
          <ScanLine className="h-5 w-5" />
          {open ? "Hide Tickets" : "View Tickets"}
        </button>
      </div>

      <div className="mx-3 mt-4 flex items-center gap-6 border-b border-neutral-200">
        <button
          onClick={() => setTab("tickets")}
          className={cn(
            "pb-3 text-sm font-bold tracking-wide transition-colors",
            tab === "tickets" ? "text-neutral-900 border-b-2 border-neutral-900" : "text-neutral-400"
          )}
        >
          TICKETS
        </button>
        <button
          onClick={() => setTab("extras")}
          className={cn(
            "pb-3 text-sm font-bold tracking-wide transition-colors",
            tab === "extras" ? "text-neutral-900 border-b-2 border-neutral-900" : "text-neutral-400"
          )}
        >
          EXTRAS
        </button>
      </div>

      {open && tab === "tickets" && ticket.order_number && (
        <div className="mx-3 mt-4">
          <p className="text-base font-black text-neutral-900">Order #{ticket.order_number}</p>
          <p className="text-xs text-neutral-500 mt-0.5">x{seatCount} Tickets</p>
        </div>
      )}

      <div className="mx-3 py-4 space-y-3">
        {open && tab === "tickets" &&
          allSeats.map((g, i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-200/60"
            >
              {ticket.package_name && (
                <p className="bg-neutral-100 text-xs font-bold text-neutral-700 uppercase tracking-wide px-4 py-2">
                  {ticket.package_name}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 p-4">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 tracking-widest">SECTION</p>
                  <p className="text-base font-black text-neutral-900 mt-0.5">{g.section || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 tracking-widest">ROW</p>
                  <p className="text-base font-black text-neutral-900 mt-0.5">{g.row || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 tracking-widest">SEAT</p>
                  <p className="text-base font-black text-neutral-900 mt-0.5">{g.seats || "—"}</p>
                </div>
              </div>
            </div>
          ))}
        {open && tab === "tickets" && allSeats.length === 0 && (
          <p className="text-center text-neutral-400 text-sm py-6">No seat details</p>
        )}
        {open && tab === "extras" && (
          <p className="text-center text-neutral-400 text-sm py-6">No extras available</p>
        )}
      </div>

      {ticket.status === "in_wallet" && isVipPackage && (
        <div className="mx-3 mb-6 rounded-xl bg-neutral-100 border border-neutral-200 px-4 py-3 text-center">
          <span className="text-xs font-medium text-neutral-500">
            VIP package tickets can't be transferred or sold
          </span>
        </div>
      )}

      {canAct && (
        <div className="mx-3 mb-6 sticky bottom-20 z-30">
          <div className="flex items-stretch bg-white rounded-full shadow-lg border border-neutral-200 overflow-hidden">
            <button
              onClick={() => onTransfer(ticket)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-[#024ddf] active:bg-blue-50 transition-colors"
            >
              <Send className="h-5 w-5" /> Transfer
            </button>
            <div className="w-px bg-neutral-200 my-2" />
            <button
              onClick={() => onSell(ticket)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-[#024ddf] active:bg-blue-50 transition-colors"
            >
              <RefreshCw className="h-5 w-5" /> Sell
            </button>
          </div>
        </div>
      )}

      {ticket.status === "listed_for_sale" && (
        <div className="mx-3 mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-700">
            Listed for sale {currency.symbol}{ticket.listing_price ?? "—"}
          </span>
          <button
            onClick={() => onRemoveListing?.(ticket)}
            className="text-xs font-bold text-neutral-500"
          >
            Remove listing
          </button>
        </div>
      )}
      {ticket.status === "transferred" && (
        <div className="mx-3 mb-6 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <span className="text-xs font-semibold text-blue-700">
            Transferred to {ticket.transfer_to}
          </span>
        </div>
      )}
    </div>
  );
}
