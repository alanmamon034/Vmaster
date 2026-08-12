import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, X, Ticket as TicketIcon } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { useLocationSettings } from "@/lib/LocationContext";

export default function Sell() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency, country } = useLocationSettings();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTickets([]);
        return;
      }
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("owner_id", user.id)
        .eq("country", country.code)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setTickets(data || []);
      const p = {};
      (data || []).forEach((t) => (p[t.id] = t.listing_price ?? t.price ?? ""));
      setPrices(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [country.code]);

  const inWallet = tickets.filter((t) => t.status === "in_wallet");
  const listed = tickets.filter((t) => t.status === "listed_for_sale");

  const listForSale = async (t) => {
    const price = Number(prices[t.id]);
    if (!price || price <= 0) {
      toast({ title: "Enter a listing price", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "listed_for_sale", listing_price: price })
        .eq("id", t.id);
      if (error) throw error;
      toast({ title: "Listed for sale" });
      load();
    } catch (e) {
      toast({ title: "Failed to list", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removeListing = async (t) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "in_wallet", listing_price: null })
        .eq("id", t.id);
      if (error) throw error;
      toast({ title: "Listing removed" });
      load();
    } catch (e) {
      toast({ title: "Failed to remove", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-20 px-2 py-1.5 rounded-lg border border-neutral-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-100 px-4 py-4">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 flex items-center gap-2">
          <Tag className="h-6 w-6 text-[#2563eb]" /> Sell
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5 font-medium">
          List your tickets for resale
        </p>
      </header>

      <div className="px-4 py-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-[#2563eb] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-sm font-bold text-neutral-900 mb-3">
                In your wallet ({inWallet.length})
              </h2>
              {inWallet.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 py-10 text-center">
                  <TicketIcon className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400 font-medium">
                    No tickets to list right now
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inWallet.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 bg-white rounded-xl p-3 border border-neutral-200/60 shadow-sm"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                        {t.image_url ? (
                          <Image src={t.image_url} fittingType="fill" className="h-full w-full" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 line-clamp-1">
                          {t.event_name}
                        </p>
                        <p className="text-xs text-neutral-500 line-clamp-1">
                          {t.main_section} {t.main_row}/{t.main_seat} · {t.event_date}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-neutral-400">{currency.symbol}</span>
                          <input
                            type="number"
                            value={prices[t.id] ?? ""}
                            onChange={(e) =>
                              setPrices((p) => ({ ...p, [t.id]: e.target.value }))
                            }
                            placeholder="Price"
                            className={inputCls}
                          />
                          <button
                            disabled={busy}
                            onClick={() => listForSale(t)}
                            className="ml-auto text-xs font-bold text-white bg-[#2563eb] px-3 py-1.5 rounded-lg disabled:opacity-50 active:scale-95 transition"
                          >
                            List
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-bold text-neutral-900 mb-3">
                Listed for sale ({listed.length})
              </h2>
              {listed.length === 0 ? (
                <p className="text-xs text-neutral-400">Nothing listed yet.</p>
              ) : (
                <div className="space-y-3">
                  {listed.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 border border-amber-200"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                        {t.image_url ? (
                          <Image src={t.image_url} fittingType="fill" className="h-full w-full" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 line-clamp-1">
                          {t.event_name}
                        </p>
                        <p className="text-xs font-semibold text-amber-700">
                          Listed for {currency.symbol}{t.listing_price}
                        </p>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => removeListing(t)}
                        className="flex items-center gap-1 text-xs font-bold text-neutral-500 active:opacity-60"
                      >
                        <X className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
