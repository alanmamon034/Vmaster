import React, { createContext, useContext, useState, useEffect } from "react";

// Countries with native names, emoji flags and currency.
// `resale` controls the nav:
//  true  -> 5-tab (Discover, For You, My Tickets, Sell, My Account)
//  false -> 4-tab (Discover, Favourites, My Tickets, My Account)
export const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", resale: true, currency: { code: "USD", symbol: "$" } },
  { code: "CA", name: "Canada", flag: "🇨🇦", resale: true, currency: { code: "CAD", symbol: "CA$" } },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", resale: true, currency: { code: "GBP", symbol: "£" } },
  { code: "IE", name: "Ireland", flag: "🇮🇪", resale: true, currency: { code: "EUR", symbol: "€" } },
  { code: "AU", name: "Australia", flag: "🇦🇺", resale: false, currency: { code: "AUD", symbol: "A$" } },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", resale: false, currency: { code: "NZD", symbol: "NZ$" } },
  { code: "DE", name: "Deutschland", flag: "🇩🇪", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "AT", name: "Österreich", flag: "🇦🇹", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "CH", name: "Schweiz", flag: "🇨🇭", resale: false, currency: { code: "CHF", symbol: "CHF" } },
  { code: "NL", name: "Nederland", flag: "🇳🇱", resale: false, currency: { code: "EUR", symbol: "€" } },
  { code: "BE", name: "België", flag: "🇧🇪", resale: false, currency: { code: "EUR", symbol: "€" } },
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
