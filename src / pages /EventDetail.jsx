import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ev = await base44.entities.Event.get(id);
        setEvent(ev);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-[#024ddf] rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-neutral-500 font-medium">Event not found</p>
        <button onClick={() => navigate("/")} className="mt-3 text-[#024ddf] font-bold text-sm">
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative aspect-[16/10] bg-neutral-200">
        <Image src={event.image_url} fittingType="fill" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 p-2 rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-800" />
        </button>
      </div>

      <div className="px-4 py-5">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#024ddf]/10 text-[#024ddf] px-2 py-0.5 rounded">
          {event.category}
        </span>
        <h1 className="text-2xl font-black text-neutral-900 mt-2 leading-tight">
          {event.title}
        </h1>
        {event.artist && (
          <p className="text-base font-semibold text-neutral-500 mt-1">{event.artist}</p>
        )}

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-neutral-700">
            <Calendar className="h-4 w-4 text-[#024ddf]" />
            <span className="font-medium">{event.date}</span>
            {event.time && <span className="text-neutral-400">· {event.time}</span>}
          </div>
          <div className="flex items-center gap-2 text-neutral-700">
            <MapPin className="h-4 w-4 text-[#024ddf]" />
            <span className="font-medium">{event.venue}</span>
            {event.city && <span className="text-neutral-400">· {event.city}</span>}
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-neutral-600 mt-4 leading-relaxed">{event.description}</p>
        )}

        <button
          onClick={() => navigate("/add")}
          className="mt-6 w-full py-3.5 rounded-xl bg-[#024ddf] text-white font-bold text-base shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
        >
          Add tickets to my wallet
        </button>
      </div>
    </div>
  );
}
