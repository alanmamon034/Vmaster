import { fetchTicketmasterEvents } from "@/api/ticketmasterClient";

// ... inside the component, replace the existing useEffect with:
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
