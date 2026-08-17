import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScanLine, Send, RefreshCw, Printer, X, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { useLocationSettings } from "@/lib/LocationContext";

const statusMeta = {
  in_wallet: { label: "In Wallet", color: "bg-green-500/20 text-green-300" },
  listed_for_sale: { label: "Listed for Sale", color: "bg-amber-500/20 text-amber-300" },
  transferred: { label: "Transferred", color: "bg-blue-500/20 text-blue-300" },
  sold: { label: "Sold", color: "bg-white/10 text-neutral-300" },
};

const deliveryLabels = {
  mobile: "Mobile Ticket",
  print_at_home: "Print-At-Home",
  venue_collection: "Venue Collection",
  courier: "Courier Delivery",
};

// Builds a QR code image URL encoding the ticket's unique identifiers.
// Uses a free, no-key-required QR image API — no extra package needed.
function qrCodeUrl(ticket, size = 200) {
  const payload = JSON.stringify({
    id: ticket.id,
    order: ticket.order_number || "",
    event: ticket.event_name,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}

// Fetches the QR image and converts it to a data URL so it can be embedded
// directly into the generated PDF (fetching, not just linking, avoids
// broken images if the PDF is opened offline later).
async function fetchImageAsDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function generateTicketPdf(ticket, allSeats) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text(ticket.event_name || "Event", margin, y);
  y += 28;

  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  const dateLabel = ticket.event_date
    ? format(new Date(ticket.event_date), "EEEE, MMMM d, yyyy")
    : "Date TBC";
  doc.text(dateLabel, margin, y);
  y += 16;
  doc.text(ticket.venue || "Venue TBC", margin, y);
  y += 30;

  if (ticket.order_number) {
    doc.setFont(undefined, "bold");
    doc.text(`Order #${ticket.order_number}`, margin, y);
    doc.setFont(undefined, "normal");
    y += 20;
  }

  allSeats.forEach((seat, i) => {
    doc.setFont(undefined, "bold");
    doc.text(`Ticket ${i + 1}`, margin, y);
    doc.setFont(undefined, "normal");
    y += 16;
    doc.text(
      `Section ${seat.section || "—"}   Row ${seat.row || "—"}   Seat ${seat.seats || "—"}`,
      margin,
      y
    );
    y += 24;
  });

  try {
    const qrDataUrl = await fetchImageAsDataUrl(qrCodeUrl(ticket, 300));
    doc.addImage(qrDataUrl, "PNG", margin, y, 120, 120);
    doc.setFontSize(9);
    doc.text("Present this code for entry", margin, y + 132);
  } catch (e) {
    // If the QR image can't be fetched (offline, network blocked), the
    // PDF still generates with all the text details above.
  }

  doc.save(`${(ticket.event_name || "ticket").replace(/[^a-z0-9]/gi, "_")}.pdf`);
}

function HelpDialog({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 sticky top-0 bg-white">
          <h2 className="text-sm font-bold text-neutral-900">Help & Support</h2>
          <button onClick={onClose} className="p-1 text-neutral-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-bold text-neutral-900 mb-1">Where's my ticket?</p>
            <p className="text-sm text-neutral-500">
              Your ticket is available any time under My Tickets. Tap View Tickets to
              see your seat details and QR code for entry.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 mb-1">Can I transfer or sell my ticket?</p>
            <p className="text-sm text-neutral-500">
              Use the Transfer or Sell buttons on your ticket. VIP package tickets
              can't be transferred or sold once purchased.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 mb-1">Need more help?</p>
            <div className="flex items-center gap-2 text-sm text-neutral-700 mt-2">
              <Mail className="h-4 w-4 text-neutral-400" /> support@example.com
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700 mt-1">
              <Phone className="h-4 w-4 text-neutral-400" /> +1 (800) 555-0100
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailCard({ ticket, onTransfer, onSell, onRemoveListing, readOnly = false }) {
  const navigate = useNavigate();
  const { currency, country } = useLocationSettings();
  const isSG = country.code === "SG";
  const BOOKING_FEE = 20;
  const [tab, setTab] = useState("tickets");
  const [open, setOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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
  const isVipPackage =
    ticket.country === "SG" &&
    (ticket.ticket_type === "vip" ||
      (!ticket.ticket_type && !!ticket.package_name));
  const canAct = ticket.status === "in_wallet" && !isVipPackage && !readOnly;
  const extras = Array.isArray(ticket.extras) ? ticket.extras : [];

  const handlePrintAtHome = async () => {
    setGeneratingPdf(true);
    try {
      await generateTicketPdf(ticket, allSeats);
    } catch (e) {
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-neutral-100">
      <div className="relative aspect-[16/9] bg-neutral-800">
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
          <button
            onClick={() => setHelpOpen(true)}
            className="text-white text-sm font-semibold"
          >
            Help
          </button>
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
          EXTRAS {extras.length > 0 && `(${extras.length})`}
        </button>
      </div>

      {open && tab === "tickets" && ticket.order_number && (
        <div className="mx-3 mt-4">
          <p className="text-base font-black text-neutral-900">Order #{ticket.order_number}</p>
          <p className="text-xs text-neutral-500 mt-0.5">x{seatCount} Tickets</p>
          {ticket.delivery_method && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {deliveryLabels[ticket.delivery_method] || ticket.delivery_method}
            </p>
          )}
        </div>
      )}

      {open && tab === "tickets" && allSeats.length > 0 && (
        <div className="mx-3 mt-4 bg-white rounded-xl p-4 shadow-sm border border-neutral-200/60 flex flex-col items-center">
          <img
            src={qrCodeUrl(ticket, 160)}
            alt="Ticket QR code"
            className="h-40 w-40"
            crossOrigin="anonymous"
          />
          <p className="text-xs text-neutral-400 mt-2">Present this code for entry</p>
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
          extras.length > 0 ? (
            <div className="space-y-2">
              {extras.map((extra, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200/60"
                >
                  <p className="text-sm font-semibold text-neutral-900">{extra}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-400 text-sm py-6">No extras available</p>
          )
        )}
      </div>

      {isSG && open && tab === "tickets" && ticket.price != null && (
        <div className="mx-3 mb-3 bg-white rounded-xl p-4 shadow-sm border border-neutral-200/60 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              Ticket price ({currency.symbol}{Number(ticket.price).toFixed(2)} x {seatCount})
            </span>
            <span className="font-semibold text-neutral-900">
              {currency.symbol}{(Number(ticket.price) * seatCount).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Booking Fee</span>
            <span className="font-semibold text-neutral-900">
              {currency.symbol}{BOOKING_FEE.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pt-1.5 border-t border-neutral-100 mt-1.5">
            <span className="font-bold text-neutral-900">Subtotal</span>
            <span className="font-bold text-neutral-900">
              {currency.symbol}{(Number(ticket.price) * seatCount + BOOKING_FEE).toFixed(2)}
            </span>
          </div>
          <button
            onClick={handlePrintAtHome}
            disabled={generatingPdf}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#024ddf] text-white font-bold text-sm active:bg-[#023bb8] transition-colors disabled:opacity-60"
          >
            <Printer className="h-4 w-4" /> {generatingPdf ? "Generating…" : "Print-at-Home"}
          </button>
        </div>
      )}

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

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
