import * as React from "react";
import { apiGet } from "@/lib/api";

type Currency = "AED" | "USD" | "EUR";
interface Rates {
  usdPerAed: number;
  eurPerAed: number;
}

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Format an AED price in the chosen display currency (≈ for conversions). */
  format: (priceAed: number) => string;
}

const Ctx = React.createContext<CurrencyCtx>({
  currency: "AED",
  setCurrency: () => undefined,
  format: (p) => `AED ${p.toLocaleString()}`,
});

/**
 * Display-currency context (P6-04, FR-I5). AED stays the transactional
 * currency; USD/EUR are approximate display conversions from /rates (USD is
 * the central-bank peg; EUR is ECB daily-cached). The choice persists in
 * localStorage and applies across cards + detail prices.
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = React.useState<Currency>("AED");
  const [rates, setRates] = React.useState<Rates | null>(null);

  React.useEffect(() => {
    const saved = window.localStorage.getItem("carsens.currency") as Currency | null;
    if (saved && ["AED", "USD", "EUR"].includes(saved)) setCurrencyState(saved);
  }, []);

  React.useEffect(() => {
    if (currency === "AED" || rates) return;
    apiGet<Rates>("/rates").then(setRates).catch(() => undefined);
  }, [currency, rates]);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    window.localStorage.setItem("carsens.currency", c);
  };

  const format = React.useCallback(
    (priceAed: number) => {
      if (currency === "USD" && rates)
        return `≈ $${Math.round(priceAed * rates.usdPerAed).toLocaleString()}`;
      if (currency === "EUR" && rates)
        return `≈ €${Math.round(priceAed * rates.eurPerAed).toLocaleString()}`;
      return `AED ${priceAed.toLocaleString()}`;
    },
    [currency, rates],
  );

  return <Ctx.Provider value={{ currency, setCurrency, format }}>{children}</Ctx.Provider>;
}

export function useCurrency(): CurrencyCtx {
  return React.useContext(Ctx);
}
