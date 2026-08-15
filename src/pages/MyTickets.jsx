import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import TicketDetailCard from "@/components/TicketDetailCard";
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

export default function MyTickets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency, country } = useLocationSettings();
  const isSG = country.code === "SG";

  const [subTab, setSubTab] = useState("purchased"); // purchased | received
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const [receivedTickets, setReceivedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionTicket, setActionTicket] = useState(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferName, setTransferName] = useState("");
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

  const tickets = subTab === "received" ? receivedTickets : purchasedTickets;

  const openAction = (ticket, type) => {
    setActionTicket({ ticket, type });
    setTransferEmail("");
    setTransferName("");
    setSellPrice(ticket.price ? String(ticket.price) : "");
  };
  const closeAction = () => {
    setActionTicket(null);
    setBusy(false);
  };

  const confirmAction = async () => {
    if (!actionTicket) return;
    const { ticket, type } = actionTicket;
    setBusy(true);
    try {
      if (type === "transfer") {
        if (!transferName.trim() || !transferEmail.trim()) {
          toast({ title: "Enter recipient name and email", variant: "destructive" });
          setBusy(false);
          return;
        }
        const { error } = await supabase
          .from("tickets")
          .update({
            status: "transferred",
            transfer_to: transferEmail.trim(),
            transfer_to_name: transferName.trim(),
          })
          .eq("id", ticket.id);
        if (error) throw error;
        toast({ title: `Ticket transferred to ${transferName.trim()}` });
      } else {
        const { error } = await supabase
          .from("tickets")
          .update({
            status: "listed_for_sale",
            listing_price: sellPrice ? Number(sellPrice) : null,
          })
          .eq("id", ticket.id);
        if (error) throw error;
        toast({ title: `Ticket listed for sale ${currency.symbol}${sellPrice || "0"}` });
      }
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
      {isSG && (
        <div className="flex border-b border-neutral-200 bg-white sticky top-0 z-30">
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

      <Dialog open={!!actionTicket} onOpenChange={(o) => !o && closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTicket?.type === "transfer" ? "Transfer ticket" : "Sell ticket"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500 -mt-2">
            {actionTicket?.ticket?.event_name}
          </p>
          {actionTicket?.type === "transfer" ? (
            <div className="py-2 space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                  Recipient name
                </label>
                <Input
                  type="text"
                  value={transferName}
                  onChange={(e) => setTransferName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                  Recipient email
                </label>
                <Input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="friend@email.com"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                The recipient will be able to access this ticket.
              </p>
            </div>
          ) : (
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
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={closeAction} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={busy}
              className="bg-[#024ddf] text-white hover:bg-[#024ddf]/90"
            >
              {busy
                ? "Processing…"
                : actionTicket?.type === "transfer"
                ? "Confirm transfer"
                : "List for sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
