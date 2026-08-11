import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, ChevronDown } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { fetchTicketmasterEvents } from "@/api/ticketmasterClient";
import { Image } from "@/components/ui/image";
import { useLocationSettings } from "@/lib/LocationContext";
import ChangeLocation from "@/components/ChangeLocation";

const categories = ["All", "Concerts", "Sports", "Theatre", "Family", "Comedy", "Festivals"];

export default function Home() {
  const navigate = useNavigate();
  const { country } = useLocationSettings();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: ownEvents }, tmEvents] = await Promise.all([
          supabase.from("events").select("*").order("date", { ascending: false }).limit(50),
          fetchTicketmasterEvents({ countryCode: "US", size: 30 }),
        ]);
        setEvents([...(ownEvents || []), ...tmEvents]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = events.filter((ev) => {
    const matchCat = category === "All" || ev.category === category;
    const q = query.toLowerCase().trim();
    const matchQ =
      !q ||
      ev.title?.toLowerCase().includes(q) ||
      ev.artist?.toLowerCase().includes(q) ||
      ev.venue?.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const featured = filtered[0];

  const goToEvent = (ev) => {
    if (ev.source === "ticketmaster") {
      window.open(ev.ticketmasterUrl, "_blank");
    } else {
      navigate(`/event/${ev.id}`);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-100">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-[#024ddf]">
              ticketmaster
            </h1>
            <button
              onClick={() => setLocationOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neutral-100 active:scale-95 transition"
            >
              <span className="text-base leading-none">{country.flag}</span>
              <span className="text-xs font-bold text-neutral-800 max-w-[90px] truncate">
                {country.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 font-medium">
            All your entertainment needs in one place
          </p>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artists, venues, teams..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-100 text-sm font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#024ddf]/30"
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                category === cat
                  ? "bg-[#024ddf] text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-[#024ddf] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 font-medium text-sm">No events found</p>
            <p className="text-neutral-400 text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          <>
            {featured && (
              <button
                onClick={() => goToEvent(featured)}
                className="block w-full text-left mb-6"
              >
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-neutral-200">
                  <Image
                    src={featured.image_url}
                    fittingType="fill"
                    className="h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#024ddf] px-2 py-0.5 rounded">
                      Featured
                    </span>
                    <h2 className="text-xl font-extrabold mt-2 leading-tight">
                      {featured.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-white/90">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {featured.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {featured.venue}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )}

            <h3 className="text-base font-bold text-neutral-900 mb-3">
              {category === "All" ? "Popular events" : category}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => goToEvent(ev)}
                  className="text-left group"
                >
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-neutral-200">
                    <Image
                      src={ev.image_url}
                      fittingType="fill"
                      className="h-full w-full group-active:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="text-[9px] font-bold uppercase bg-white/90 text-neutral-700 px-2 py-0.5 rounded">
                        {ev.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-neutral-900 mt-2 line-clamp-2 leading-tight">
                    {ev.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                    {ev.venue}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{ev.date}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <ChangeLocation open={locationOpen} onClose={() => setLocationOpen(false)} />
    </div>
  );
}
