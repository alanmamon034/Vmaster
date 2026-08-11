import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminTickets from "@/components/admin/AdminTickets";

export default function Admin() {
  const navigate = useNavigate();
  const { profile, isLoadingAuth } = useAuth();
  const [tab, setTab] = useState("events");

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-[#2563eb] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <ShieldAlert className="h-12 w-12 text-neutral-300 mb-3" />
        <h1 className="text-lg font-bold text-neutral-900">Admin access required</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Only admin accounts can manage events and tickets.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-5 flex items-center gap-2 text-sm font-bold text-[#2563eb]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to app
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "events", label: "Events" },
    { id: "tickets", label: "Tickets" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 bg-[#2563eb] text-white px-4 py-4">
        <h1 className="text-xl font-black flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" /> Admin
        </h1>
        <p className="text-xs text-white/80 mt-0.5">
          Manage events & tickets shown in the app
        </p>
      </header>

      <div className="flex border-b border-neutral-200 bg-white sticky top-[64px] z-30">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              tab === t.id
                ? "text-[#2563eb] border-b-2 border-[#2563eb]"
                : "text-neutral-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-4">
        {tab === "events" ? <AdminEvents /> : <AdminTickets />}
      </div>
    </div>
  );
}
