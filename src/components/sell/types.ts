/**
 * Sell wizard (task P1-02) — shared types + constants.
 *
 * The backend expects ONE create call, so steps 1–2 accumulate client state
 * (react-hook-form values kept as strings; numeric coercion happens once,
 * when the CreateListingDto is built in the wizard). The same string-shaped
 * values are what FR-L2 persists to localStorage between sessions.
 */

export interface VehicleFormValues {
  makeId: string;
  modelId: string;
  /** Optional — but selecting it (with year) unlocks the FR-VS3 auto-fill. */
  trimId: string;
  year: string;
  regionalSpec: string;
}

export interface SpecsFormValues {
  mileageKm: string;
  fuelType: string;
  transmission: string;
  /** "NONE" = not specified (Radix Select items cannot carry ""). */
  cylinders: string;
  exteriorColor: string;
  interiorColor: string;
  emirateId: string;
  vin: string;
  priceAed: string;
  isNegotiable: boolean;
  description: string;
}

/** Display names captured at selection time (for review + draft restore). */
export interface DraftNames {
  make?: string;
  model?: string;
  trim?: string;
  emirate?: string;
}

/** FR-L2 — draft autosave payload persisted to localStorage. */
export interface SellDraftV1 {
  v: 1;
  step: 1 | 2 | 3 | 4;
  vehicle?: VehicleFormValues;
  specs?: SpecsFormValues;
  names?: DraftNames;
  /** Set once POST /listings succeeded at the end of step 2. */
  listing?: { id: string; slug: string } | null;
  /** Photos already attached to the draft (files themselves can't persist). */
  attachedCount: number;
  savedAt: string;
}

export const SELL_DRAFT_KEY = "carsens.sell.draft.v1";

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 10;
export const YEAR_MAX = 2026;
export const YEAR_MIN = 1990;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 4000;

/** Enum options — labels come from the shared listings catalog (enum.*). */
export const REGIONAL_SPECS = [
  "GCC",
  "AMERICAN",
  "EUROPEAN",
  "JAPANESE",
  "CANADIAN",
  "KOREAN",
  "CHINESE",
  "OTHER",
] as const;

export const FUEL_TYPES = [
  "PETROL",
  "DIESEL",
  "HYBRID",
  "ELECTRIC",
  "PLUGIN_HYBRID",
] as const;

export const TRANSMISSIONS = [
  "AUTOMATIC",
  "MANUAL",
  "CVT",
  "SEMI_AUTOMATIC",
] as const;

export const CYLINDER_OPTIONS = ["3", "4", "5", "6", "8", "10", "12"] as const;

export const EMPTY_VEHICLE: VehicleFormValues = {
  makeId: "",
  modelId: "",
  trimId: "",
  year: "",
  regionalSpec: "GCC",
};

export const EMPTY_SPECS: SpecsFormValues = {
  mileageKm: "",
  fuelType: "",
  transmission: "",
  cylinders: "NONE",
  exteriorColor: "",
  interiorColor: "",
  emirateId: "",
  vin: "",
  priceAed: "",
  isNegotiable: true,
  description: "",
};

/** i18n record lookup with graceful fallback (taxonomy/spec names). */
export function localizedName(
  item: { name: string; i18n: Record<string, string> | null },
  locale: string,
): string {
  return item.i18n?.[locale] ?? item.name;
}
