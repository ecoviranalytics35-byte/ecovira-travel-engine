import type { FeeBreakdown, Money, TripContext, FlightOption } from "./types";

export function fmtMoney(m?: Money | null): string {
  if (!m) return "";
  if (m.formatted) return m.formatted;
  const amt = Number(m.amount || 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: m.currency || "AUD",
    maximumFractionDigits: 0,
  }).format(amt);
}

export function formatFeeBreakdown(b: FeeBreakdown): string[] {
  const lines: string[] = [];
  if (b.baseFare) lines.push(`Base fare: ${fmtMoney(b.baseFare)}`);
  if (b.taxes) lines.push(`Taxes: ${fmtMoney(b.taxes)}`);
  if (b.airlineFees) lines.push(`Airline fees/surcharges: ${fmtMoney(b.airlineFees)}`);
  if (b.paymentProcessingFee) lines.push(`Payment processing: ${fmtMoney(b.paymentProcessingFee)}`);
  if (b.ecoviraServiceFee) lines.push(`Ecovira service fee: ${fmtMoney(b.ecoviraServiceFee)}`);
  if (b.total) lines.push(`Total: ${fmtMoney(b.total)}`);
  return lines;
}

export function summarizeRoute(ctx?: TripContext): string {
  const from = ctx?.route?.from;
  const to = ctx?.route?.to;
  const depart = ctx?.dates?.depart;
  const ret = ctx?.dates?.return;
  const pax = ctx?.passengers;
  const cabin = ctx?.cabin;
  const parts: string[] = [];
  if (from && to) parts.push(`${from} → ${to}`);
  if (depart) parts.push(`Depart: ${depart}`);
  if (ret) parts.push(`Return: ${ret}`);
  if (pax) parts.push(`${pax} pax`);
  if (cabin) parts.push(cabin);
  return parts.length ? parts.join(" • ") : "";
}

export function flightOneLine(o: FlightOption): string {
  const airline = o.airlineName || o.airlineIata || "Airline";
  const price = fmtMoney(o.price);
  const stops =
    typeof o.itineraries?.[0]?.stops === "number"
      ? o.itineraries[0].stops
      : Math.max(0, (o.itineraries?.[0]?.segments?.length ?? 1) - 1);
  const stopsLabel = stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`;
  const durMins = o.itineraries?.[0]?.durationMins;
  const durLabel = durMins ? `${Math.round(durMins / 60)}h ${durMins % 60}m` : "";
  const flex = o.refundable ? "Refundable" : o.changeable ? "Changeable" : "Standard";
  return `${airline} • ${stopsLabel}${durLabel ? ` • ${durLabel}` : ""} • ${flex} • ${price}`;
}

