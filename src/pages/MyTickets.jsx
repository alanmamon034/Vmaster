import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Layers } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import TicketDetailCard from "@/components/TicketDetailCard";
import TransferSheet from "@/components/TransferSheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useLocationSettings } from "@/lib/LocationContext";

function getAllSeats(ticket) {
  if ((ticket.seat_groups || []).length > 0) return ticket.seat_groups;
  if (ticket.main_section || ticket.main_row || ticket.main_seat) {
    return [{ section: ticket.main_section, row: ticket.main_row, seats: ticket.main_seat }];
  }
  return [];
}

export default function MyTickets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency, country } = useLocationSettings();
  const isSG = country.code === "SG";

  const [subTab, setSubTab] = useState("purchased"); // purchased | received
  const [dateTab, setDateTab] = useState("upcoming"); // upcoming | past
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const [receivedTickets, setReceivedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionTicket, setActionTicket] = useState(null); // { ticket, type }
  const [sellPrice, setSellPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPurchasedTickets([]);
        setReceivedTickets([]);
        return;
      }

      const { data: purchased, error: purchasedError } = await supabase
        .from("tickets")
        .select("*")
        .eq("owner_id", user.id)
        .eq("country", country.code)
        .order("created_at", { ascending: false })
        .limit(100);
      if (purchasedError) throw purchasedError;
      setPurchasedTickets(purchased || []);

      if (isSG && user.email) {
        const { data: received, error: receivedError } = await supabase
          .from("tickets")
          .select("*")
          .eq("transfer_to", user.email)
          .eq("country", country.code)
          .order("created_at", { ascending: false })
          .limit(100);
        if (receivedError) throw receivedError;
        setReceivedTickets(received || []);
      } else {
        setReceivedTickets([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [country.code]);

  const baseTickets = subTab === "received" ? receivedTickets : purchasedTickets;

  const now = new Date();
  const isUpcoming = (t) => {
    if (!t.event_date) return true;
    return new Date(t.event_date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  const upcomingTickets = baseTickets.filter(isUpcoming);
  const pastTickets = baseTickets.filter((t) => !isUpcoming(t));
  const tickets = dateTab === "past" ? pastTickets : upcomingTickets;

  const openAction = (ticket, type) => {
    setActionTicket({ ticket, type });
    setSellPrice(ticket.price ? String(ticket.price) : "");
  };
  const closeAction = () => {
    setActionTicket(null);
    setBusy(false);
  };

  const handleTransferConfirm = async ({ selectedIndices, name, email }) => {
    const ticket = actionTicket.ticket;
    const allSeats = getAllSeats(ticket);
    const remaining = allSeats.filter((_, idx) => !selectedIndices.includes(idx));
    const transferred = allSeats.filter((_, idx) => selectedIndices.includes(idx));

    setBusy(true);
    try {
      if (remaining.length === 0) {
        const { error } = await supabase
          .from("tickets")
          .update({
            status: "transferred",
            transfer_to: email,
            transfer_to_name: name,
          })
          .eq("id", ticket.id);
        if (error) throw error;
      } else {
        const { error: updateError } = await supabase
          .from("tickets")
          .update({
            seat_groups: remaining,
            main_section: null,
            main_row: null,
            main_seat: null,
          })
          .eq("id", ticket.id);
        if (updateError) throw updateError;

        const { id, created_at, ...rest } = ticket;
        const { error: insertError } = await supabase.from("tickets").insert({
          ...rest,
          seat_groups: transferred,
          main_section: null,
          main_row: null,
          main_seat: null,
          status: "transferred",
          transfer_to: email,
          transfer_to_name: name,
        });
        if (insertError) throw insertError;
      }
      toast({ title: `Ticket transferred to ${name}` });
      await load();
      closeAction();
    } catch (e) {
      toast({ title: "Transfer failed", variant: "destructive" });
      setBusy(false);
    }
  };

  const confirmSell = async () => {
    if (!actionTicket) return;
    const { ticket } = actionTicket;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "listed_for_sale",
          listing_price: sellPrice ? Number(sellPrice) : null,
        })
        .eq("id", ticket.id);
      if (error) throw error;
      toast({ title: `Ticket listed for sale ${currency.symbol}${sellPrice || "0"}` });
      await load();
      closeAction();
    } catch (e) {
      toast({ title: "Action failed", variant: "destructive" });
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-[#024ddf] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-black text-white px-4 py-3 flex items-center justify-between">
        <Layers className="h-5 w-5 text-white/70" />
        <h1 className="text-base font-bold">My Tickets</h1>
        <span className="text-xl leading-none">{country.flag}</span>
      </header>

      <div className="flex border-b border-neutral-200 bg-white sticky top-[52px] z-30">
        <button
          onClick={() => setDateTab("upcoming")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            dateTab === "upcoming"
              ? "text-[#024ddf] border-b-2 border-[#024ddf]"
              : "text-neutral-400"
          }`}
        >
          Upcoming ({upcomingTickets.length})
        </button>
        <button
          onClick={() => setDateTab("past")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            dateTab === "past"
              ? "text-[#024ddf] border-b-2 border-[#024ddf]"
              : "text-neutral-400"
          }`}
        >
          Past ({pastTickets.length})
        </button>
      </div>

      {isSG && (
        <div className="flex border-b border-neutral-200 bg-white sticky top-[100px] z-20">
          <button
            onClick={() => setSubTab("purchased")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              subTab === "purchased"
                ? "text-[#024ddf] border-b-2 border-[#024ddf]"
                : "text-neutral-400"
            }`}
          >
            Purchased
          </button>
          <button
            onClick={() => setSubTab("received")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              subTab === "received"
                ? "text-[#024ddf] border-b-2 border-[#024ddf]"
                : "text-neutral-400"
            }`}
          >
            Received
          </button>
        </div>
      )}

      {isSG && (
        <div className="mx-3 mt-3 rounded-lg bg-purple-50 border border-purple-100 px-4 py-3">
          <p className="text-xs text-purple-700 leading-relaxed">
            Find your purchase and tickets received via ticket transfer here.
            Ticket transfer allows you to transfer some or all of your tickets to
            another account. Not all orders are eligible for transfer.
          </p>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
            <Plus className="h-10 w-10 text-neutral-300" />
          </div>
          <p className="text-neutral-900 font-bold text-lg">
            {subTab === "received" ? "No tickets received" : "No tickets yet"}
          </p>
          <p className="text-neutral-500 text-sm mt-1">
            {subTab === "received"
              ? "Tickets transferred to you will show up here"
              : "Add your first ticket from Settings"}
          </p>
          {subTab === "purchased" && (
            <button
              onClick={() => navigate("/add")}
              className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#024ddf] text-white font-bold text-sm active:scale-95 transition-transform"
            >
              <Plus className="h-5 w-5" /> Add a ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8 pt-4">
          {tickets.map((ticket) => (
            <TicketDetailCard
              key={ticket.id}
              ticket={ticket}
              readOnly={subTab === "received"}
              onTransfer={(t) => openAction(t, "transfer")}
              onSell={(t) => openAction(t, "sell")}
              onRemoveListing={async (t) => {
                await supabase
                  .from("tickets")
                  .update({ status: "in_wallet", listing_price: null })
                  .eq("id", t.id);
                load();
              }}
            />
          ))}
        </div>
      )}

      <TransferSheet
        open={!!actionTicket && actionTicket.type === "transfer"}
        ticket={actionTicket?.ticket}
        allSeats={actionTicket?.ticket ? getAllSeats(actionTicket.ticket) : []}
        onClose={closeAction}
        onConfirm={handleTransferConfirm}
        busy={busy}
      />

      <Dialog
        open={!!actionTicket && actionTicket.type === "sell"}
        onOpenChange={(o) => !o && closeAction()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell ticket</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500 -mt-2">
            {actionTicket?.ticket?.event_name}
          </p>
          <div className="py-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              Listing price ({currency.symbol})
            </label>
            <Input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-neutral-400 mt-2">
              Your ticket will be listed on the marketplace for others to buy.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeAction} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={confirmSell}
              disabled={busy}
              className="bg-[#024ddf] text-white hover:bg-[#024ddf]/90"
            >
              {busy ? "Processing…" : "List for sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
