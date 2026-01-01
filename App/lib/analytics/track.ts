/**
 * Analytics tracking helper
 * Emits events in the same format as search events for consistency
 * Format: {"event":"search","category":"flights","provider":"amadeus","count":10,"status":"success"}
 */
export function track(params: {
  event: string;
  category: string;
  provider?: string;
  offerId?: string;
  flightId?: string;
  status?: string;
  [key: string]: any;
}) {
  const eventData = {
    event: params.event,
    category: params.category,
    provider: params.provider || 'unknown',
    ...(params.offerId && { offerId: params.offerId }),
    ...(params.flightId && { flightId: params.flightId }),
    ...(params.status && { status: params.status }),
    // Include any additional params
    ...Object.fromEntries(
      Object.entries(params).filter(([key]) => 
        !['event', 'category', 'provider', 'offerId', 'flightId', 'status'].includes(key)
      )
    ),
  };
  
  // Emit to console (same format as search events - JSON stringified)
  console.log(JSON.stringify(eventData));
  
  // Future: Add other analytics providers here (e.g., Plausible, Google Analytics, etc.)
  // if (typeof window !== 'undefined' && window.plausible) {
  //   window.plausible(params.event, { props: params });
  // }
}

