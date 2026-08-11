import React, { useState } from "react";
import { Outlet, useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import { Search, Heart, Ticket, Banknote, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationSettings } from "@/lib/LocationContext";

export default function Layout() {
  const location = useRouterLocation();
  const navigate = useNavigate();
  const { country } = useLocationSettings();

  const navItems = country.resale
    ? [
        { label: "Discover", path: "/", icon: Search },
        { label: "For You", path: "/for-you", icon: Heart },
        { label: "My Tickets", path: "/my-tickets", icon: Ticket },
        { label: "Sell", path: "/sell", icon: Banknote },
        { label: "My Account", path: "/settings", icon: User },
      ]
    : [
        { label: "Discover", path: "/", icon: Search },
        { label: "Favourites", path: "/for-you", icon: Heart },
        { label: "My Tickets", path: "/my-tickets", icon: Ticket },
        { label: "My Account", path: "/settings", icon: User },
      ];

  return (
    <div className="min-h-screen bg-white pb-20 max-w-md mx-auto">
      <main>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 max-w-md mx-auto">
        <div className="flex items-stretch justify-around px-4 py-2.5">
          {navItems.map((item) => {
            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center py-1 active:scale-95 transition-transform"
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    active ? "text-[#2563eb]" : "text-neutral-400"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[11px] mt-0.5 font-medium transition-colors",
                    active ? "text-[#2563eb]" : "text-neutral-400"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
