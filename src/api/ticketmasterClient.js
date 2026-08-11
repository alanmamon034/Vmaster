export async function fetchTicketmasterEvents({ keyword = "", countryCode = "US", size = 20 } = {}) {
  const apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.warn("VITE_TICKETMASTER_API_KEY is not set");
    return [];
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    countryCode,
    size: String(size),
  });
  if (keyword) params.set("keyword", keyword);

  try {
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`);
    if (!res.ok) {
      console.error("Ticketmaster API error", res.status);
      return [];
    }
    const data = await res.json();
    const events = data._embedded?.events || [];
    return events.map(mapTicketmasterEvent);
  } catch (e) {
    console.error("Ticketmaster fetch failed", e);
    return [];
  }
}

function mapTicketmasterEvent(ev) {
  const venue = ev._embedded?.venues?.[0];
  const image =
    ev.images?.find((img) => img.width >= 640) || ev.images?.[0];

  return {
    id: `tm_${ev.id}`,
    title: ev.name,
    artist: ev._embedded?.attractions?.[0]?.name || "",
    venue: venue?.name || "",
    city: venue?.city?.name || "",
    date: ev.dates?.start?.localDate || "",
    time: ev.dates?.start?.localTime || "",
    image_url: image?.url || "",
    category: ev.classifications?.[0]?.segment?.name || "Concerts",
    description: ev.info || ev.pleaseNote || "",
    ticketmasterUrl: ev.url,
    source: "ticketmaster",
  };
}
