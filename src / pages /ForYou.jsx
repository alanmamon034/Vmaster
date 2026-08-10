import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

export default function ForYou() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Event.list("-date", 50);
        setEvents(list || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-100 px-4 py-4">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#2563eb]" /> For You
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5 font-medium">
          Events we think you'll love
        </p>
      </header>

      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-[#2563eb] rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 font-medium text-sm">No recommendations yet</p>
            <p className="text-neutral-400 text-xs mt-1">Check back soon for events near you</p>
          </div>
        ) : (
          events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => navigate(`/event/${ev.id}`)}
              className="block w-full text-left"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-neutral-200">
                <Image src={ev.image_url} fittingType="fill" className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2563eb] text-white px-2 py-0.5 rounded">
                    {ev.category || "Event"}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h2 className="text-lg font-extrabold leading-tight line-clamp-2">
                    {ev.title}
                  </h2>
                  {ev.artist && (
                    <p className="text-sm font-semibold text-white/85 mt-0.5">{ev.artist}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-white/90">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {ev.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {ev.venue}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
