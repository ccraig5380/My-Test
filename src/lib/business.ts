export const business = {
  name: "Houston Mosquito Control",
  shortName: "HMC",
  city: "Houston, TX",
  phone: "(713) 555-0148",
  email: "hello@houstonmosquitocontrol.example",
  licenseLabel: "Texas Structural Pest Control license",
  licenseNumber: "Pending — replace with your TDA license number",
  tagline: "Barrier mosquito spraying for homes, businesses, golf courses, and HOAs.",
} as const;

export const propertyTypes = [
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "golf", label: "Golf course" },
  { id: "hoa", label: "HOA / community" },
  { id: "other", label: "Other" },
] as const;

export type PropertyTypeId = (typeof propertyTypes)[number]["id"];

export const acreageBands = [
  { id: "0_0_5", label: "0–0.5 acres", min: 0, max: 0.5, quoteOnly: false },
  { id: "0_5_1", label: "0.5–1 acre", min: 0.5, max: 1, quoteOnly: false },
  { id: "1_5", label: "1–5 acres", min: 1, max: 5, quoteOnly: false },
  { id: "5_plus", label: "5+ acres", min: 5, max: null, quoteOnly: true },
] as const;

export type AcreageBandId = (typeof acreageBands)[number]["id"];

/** Monthly prices in cents. Replace before going live. */
export const monthlyPricesCents: Record<
  Exclude<AcreageBandId, "5_plus">,
  Record<PropertyTypeId, number>
> = {
  "0_0_5": {
    residential: 7900,
    commercial: 9900,
    golf: 24900,
    hoa: 17900,
    other: 9900,
  },
  "0_5_1": {
    residential: 9900,
    commercial: 12900,
    golf: 34900,
    hoa: 22900,
    other: 12900,
  },
  "1_5": {
    residential: 14900,
    commercial: 19900,
    golf: 49900,
    hoa: 29900,
    other: 19900,
  },
};

export const visitMinutes: Record<Exclude<AcreageBandId, "5_plus">, number> = {
  "0_0_5": 30,
  "0_5_1": 45,
  "1_5": 90,
};

export const houstonZips = [
  "77002", "77003", "77004", "77005", "77006", "77007", "77008", "77009",
  "77019", "77024", "77025", "77027", "77030", "77035", "77036", "77042",
  "77046", "77054", "77056", "77057", "77063", "77074", "77081", "77096",
  "77098", "77005", "77338", "77339", "77345", "77346", "77357", "77365",
  "77373", "77375", "77377", "77379", "77380", "77381", "77382", "77386",
  "77388", "77389", "77401", "77429", "77433", "77449", "77450", "77459",
  "77477", "77478", "77479", "77494", "77498", "77502", "77503", "77504",
  "77505", "77506", "77507", "77520", "77521", "77530", "77532", "77536",
  "77546", "77571", "77573", "77581", "77584", "77586", "77598",
] as const;

export function isCoveredZip(zip: string) {
  const digits = zip.replace(/\D/g, "").slice(0, 5);
  return houstonZips.includes(digits as (typeof houstonZips)[number]);
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function planName(type: PropertyTypeId, band: Exclude<AcreageBandId, "5_plus">) {
  const typeLabel = propertyTypes.find((item) => item.id === type)?.label ?? type;
  const bandLabel = acreageBands.find((item) => item.id === band)?.label ?? band;
  return `${typeLabel} monthly · ${bandLabel}`;
}
