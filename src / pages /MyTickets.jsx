import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
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
  const { currency } = useLocationSettings();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionTicket, setActionTicket] = useState(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      const list = await base44.entities.Ticket.filter(
        { created_by_id: me.id },
        "-created_date",
        100
      );
      setTickets(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAction = (ticket, type) => {
    setActionTicket({ ticket, type });
    setTransferEmail("");
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
        if (!transferEmail.trim()) {
          toast({ title: "Enter recipient email", variant: "destructive" });
          setBusy(false);
          return;
        }
        await base44.entities.Ticket.update(ticket.id, {
          status: "transferred",
          transfer_to: transferEmail.trim(),
        });
        toast({ title: `Ticket transferred to ${transferEmail.trim()}` });
      } else {
        await base44.entities.Ticket.update(ticket.id, {
          status: "listed_for_sale",
          listing_price: sellPrice ? Number(sellPrice) : null,
        });
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

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
          <Plus className="h-10 w-10 text-neutral-300" />
        </div>
        <p className="text-neutral-900 font-bold text-lg">No tickets yet</p>
        <p className="text-neutral-500 text-sm mt-1">Add your first ticket from Settings</p>
        <button
          onClick={() => navigate("/add")}
          className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#024ddf] text-white font-bold text-sm active:scale-95 transition-transform"
        >
          <Plus className="h-5 w-5" /> Add a ticket
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-8">
        {tickets.map((ticket) => (
          <TicketDetailCard
            key={ticket.id}
            ticket={ticket}
            onTransfer={(t) => openAction(t, "transfer")}
            onSell={(t) => openAction(t, "sell")}
            onRemoveListing={async (t) => {
              await base44.entities.Ticket.update(t.id, {
                status: "in_wallet",
                listing_price: null,
              });
              load();
            }}
          />
        ))}
      </div>

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
            <div className="py-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Recipient email
              </label>
              <Input
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder="friend@email.com"
              />
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
