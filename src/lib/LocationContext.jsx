import React, { createContext, useContext, useState, useEffect } from "react";

export const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", resale: true, currency: { code: "USD", symbol: "$" } },
  { code: "CA", name: "Canada", flag: "🇨🇦", resale: true, currency: { code: "CAD", symbol: "CA$" } },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", resale: true, currency: { code: "GBP", symbol: "£" } },
  { code: "IE", name: "Ireland", flag: "🇮🇪", resale: true, currency: { code: "EUR", symbol: "€" } },
  { code: "AU", name: "Australia", flag: "🇦🇺", resale: false, currency: { code: "AUD", symbol: "A$" } },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", resale: false, currency: { code: "NZD", symbol: "NZ$" } },
  { code: "DE", name: "Deutschland", flag: "🇩🇪", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "AT", name: "Österreich", flag: "🇦🇹", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", resale: false, currency: { code: "CHF", symbol: "CHF" } },
  { code: "NL", name: "Nederland", flag: "🇳🇱", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "BE", name: "Belgium", flag: "🇧🇪", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "DK", name: "Danmark", flag: "🇩🇰", resale: false, currency: { code: "DKK", symbol: "kr" } },
  { code: "SE", name: "Sverige", flag: "🇸🇪", resale: false, currency: { code: "SEK", symbol: "kr" } },
  { code: "NO", name: "Norge", flag: "🇳🇴", resale: false, currency: { code: "NOK", symbol: "kr" } },
  { code: "FI", name: "Suomi", flag: "🇫🇮", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "PL", name: "Polska", flag: "🇵🇱", resale: false, currency: { code: "PLN", symbol: "zł" } },
  { code: "CZ", name: "Česká republika", flag: "🇨🇿", resale: false, currency: { code: "CZK", symbol: "Kč" } },
  { code: "ES", name: "España", flag: "🇪🇸", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "MX", name: "México", flag: "🇲🇽", resale: false, currency: { code: "MXN", symbol: "MX$" } },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", resale: false, currency: { code: "ZAR", symbol: "R" } },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", resale: false, currency: { code: "AED", symbol: "AED" } },
  { code: "SG", name: "Singapore", flag: "🇸🇬", resale: false, currency: { code: "SGD", symbol: "S$" } },
  { code: "KE", name: "Kenya", flag: "🇰🇪", resale: false, currency: { code: "KES", symbol: "KSh" } },
  { code: "BR", name: "Brasil", flag: "🇧🇷", resale: false, currency: { code: "BRL", symbol: "R$" } },
  { code: "CL", name: "Chile", flag: "🇨🇱", resale: false, currency: { code: "CLP", symbol: "CLP$" } },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "FR", name: "France", flag: "🇫🇷", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "IL", name: "Israel", flag: "🇮🇱", resale: false, currency: { code: "ILS", symbol: "₪" } },
  { code: "IT", name: "Italia", flag: "🇮🇹", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "PE", name: "Peru", flag: "🇵🇪", resale: false, currency: { code: "PEN", symbol: "S/" } },
  { code: "PH", name: "Philippines", flag: "🇵🇭", resale: false, currency: { code: "PHP", symbol: "₱" } },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", resale: false, currency: { code: "TWD", symbol: "NT$" } },
  { code: "TH", name: "Thailand", flag: "🇹🇭", resale: false, currency: { code: "THB", symbol: "฿" } },
  { code: "TR", name: "Türkiye", flag: "🇹🇷", resale: false, currency: { code: "TRY", symbol: "₺" } },
  { code: "GR", name: "Ελλάδα", flag: "🇬🇷", resale: false, currency: { code: "EUR", symbol: "€" } },
];

const STORAGE_KEY = "ep_location";
const DEFAULT_CODE = "US";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_CODE;
    } catch {
      return DEFAULT_CODE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  }, [code]);

  const country = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

  return (
    <LocationContext.Provider
      value={{ country, currency: country.currency, code, setCode, countries: COUNTRIES }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationSettings() {
  return useContext(LocationContext);
}
