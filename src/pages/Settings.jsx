import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Info, Shield, HelpCircle, ChevronRight, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", action: () => toast({ title: "Coming soon" }) },
        { icon: Shield, label: "Privacy & security", action: () => toast({ title: "Coming soon" }) },
      ],
    },
    {
      title: "Manage",
      items: [
        { icon: Plus, label: "Add Ticket", action: () => navigate("/add") },
        ...(profile?.role === "admin"
          ? [{ icon: Shield, label: "Admin", action: () => navigate("/admin") }]
          : []),
      ],
    },
    {
      title: "App",
      items: [
        { icon: Info, label: "About Ticket Wallet", action: () => toast({ title: "Ticket Wallet v1.0" }) },
        { icon: HelpCircle, label: "Help & support", action: () => toast({ title: "Contact support" }) },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-100 px-4 py-4">
        <h1 className="text-2xl font-black text-neutral-900">My Account</h1>
      </header>

      <div className="px-4 py-4 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title}>
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-2 px-1">
              {sec.title}
            </h2>
            <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden bg-white">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-neutral-50 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-neutral-500" />
                    <span className="flex-1 text-left text-sm font-medium text-neutral-800">
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-neutral-300" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 text-red-600 font-bold text-sm active:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" /> Log out
        </button>

        <p className="text-center text-xs text-neutral-300 pt-2">Ticket Wallet · v1.0.0</p>
      </div>
    </div>
  );
}
