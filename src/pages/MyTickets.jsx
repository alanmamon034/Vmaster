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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTickets([]);
        return;
      }
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setTickets(data || []);
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
        const { error } = await supabase
          .from("tickets")
          .update({ status: "transferred", transfer_to: transferEmail.trim() })
          .eq("id", ticket.id);
        if
