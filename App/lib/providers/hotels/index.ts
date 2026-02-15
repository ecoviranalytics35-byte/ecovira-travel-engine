import { getPrimaryHotelProvider, PROVIDER_NAMES } from "@/lib/config/providers";
import { isProduction } from "@/lib/core/env";
import type { StaysProvider } from "@/lib/stays/provider";
import { liteApiStaysProvider } from "./liteapi";
import { mockStaysProvider } from "@/lib/stays/provider";

const providers: Record<string, StaysProvider> = {
  [PROVIDER_NAMES.HOTEL.LITEAPI]: liteApiStaysProvider,
};

export function getHotelProvider(): StaysProvider {
  if (isProduction()) {
    const key = (process.env.LITEAPI_API_KEY ?? "").trim();
    if (!key) throw new Error("[production] LITEAPI_API_KEY is required");
    return liteApiStaysProvider;
  }
  const primary = getPrimaryHotelProvider();
  const provider = providers[primary];
  if (provider) return provider;
  return mockStaysProvider;
}

export { liteApiStaysProvider };
export { liteApiHealthCheck } from "./liteapi";
