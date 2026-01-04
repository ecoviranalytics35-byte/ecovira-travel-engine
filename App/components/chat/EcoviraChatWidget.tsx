"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { convertContextToBrainContext } from './contextConverter';
import type { ChatMessage } from '@/lib/ai/ecovira-brain/types';

interface EcoviraChatWidgetProps {
  context?: {
    page?: 'flights' | 'stays' | 'cars' | 'transfers' | 'my-trips';
    route?: { from?: string; to?: string };
    dates?: { depart?: string; return?: string };
    passengers?: number;
    cabin?: string;
    currency?: string;
    topFlights?: Array<{ price: string; duration: string; stops: string; from: string; to: string }>;
    selectedFlight?: any;
    results?: any[];
    // Trip context (when in My Trips)
    trip?: {
      bookingId?: string;
      bookingReference?: string;
      airlineIata?: string;
      airlineName?: string;
      flightNumber?: string;
      scheduledDeparture?: string;
      departureAirport?: string;
      arrivalAirport?: string;
    };
  };
  isOpen?: boolean;
  onClose?: () => void;
}

// Markdown rendering helper for brain responses
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('**') && line.endsWith('**')) {
      // Bold text
      const content = line.slice(2, -2);
      elements.push(<strong key={i} className="font-semibold">{content}</strong>);
      elements.push(<br key={`br-${i}`} />);
    } else if (line.trim() === '') {
      elements.push(<br key={`empty-${i}`} />);
    } else {
      elements.push(<span key={i}>{line}</span>);
      if (i < lines.length - 1) elements.push(<br key={`br-${i}`} />);
    }
  }
  
  return <>{elements}</>;
}

const FAQ_RESPONSES: Record<string, string> = {
  // Search & Navigation
  'where search': "You can search directly on this page. For flights: enter departure and destination airports (e.g., MEL, SYD), select dates, choose passengers and cabin class, then tap 'Search Flights'. For stays: enter city, check-in date, nights, and guests. For cars: enter pickup/return location and dates. For transfers: enter from/to locations and date/time. Once results appear, I'll help you compare options, prices, and currency strategies.",
  'how search': "To search: 1) Enter your travel details in the search panel (from/to, dates, passengers), 2) Select your preferred currency (top-right), 3) Tap the search button. Results appear below. The AI Assist widget (bottom-right) provides Value Scores and recommendations. I can help you understand the results and find the best option.",
  'one way round trip': "One-way means a single flight from A to B. Round-trip includes both outbound and return flights. Round-trip is often cheaper per flight, but one-way offers flexibility. Use the toggle at the top of the search panel to switch. For round-trip, you'll need to select both departure and return dates.",
  'search flights': "To search flights: Enter departure airport (e.g., MEL), destination airport (e.g., SYD), departure date, passengers, cabin class (economy/business/first), and optionally return date for round-trip. Select your currency, then tap 'Search Flights'. Results show price, duration, stops, and airline. The AI Assist widget provides Value Scores and recommendations.",
  'search stays': "To search stays: Enter city name, check-in date, number of nights, adults, children (optional), and room type. Select your currency, then tap 'Search Stays'. Results show hotel name, location, price per night, and total cost. The AI Assist widget shows total trip cost estimates.",
  'search cars': "To search cars: Enter pickup location, pickup date and time, return date and time, and driver age. Select your currency, then tap 'Search Cars'. Results show vehicle type, vendor, price per day, and total rental cost.",
  'search transfers': "To search transfers: Enter pickup location, drop-off location, date, time, and number of passengers. Select your currency, then tap 'Search Transfers'. Results show transfer type, price, and duration.",
  'filters': "Filters help narrow results. For flights: you can filter by stops (direct, 1-stop, 2+ stops), price range, departure time, airline, and duration. For stays: filter by star rating, price range, amenities, and cancellation policy. Use the search panel to adjust dates, passengers, and cabin class before searching.",
  'dates work': "Dates control when you travel. For flights: select departure date (required) and return date (for round-trip). For stays: select check-in date and number of nights. For cars: select pickup and return dates/times. Prices vary significantly by date—weekends and peak seasons cost more. Consider flexible dates to find better prices.",
  'passengers': "Passengers determine how many people are traveling. For flights: adults (required), children (2-11), infants (under 2). For stays: adults and children determine room capacity. For cars: driver age affects rental eligibility and fees. For transfers: number of passengers affects vehicle size and price. Prices are usually per person for flights, per night for stays, per day for cars.",
  'cabin class': "Cabin class determines comfort level. Economy: standard seating, basic amenities. Business: more space, better meals, priority boarding. First: premium experience, most expensive. Prices increase with class. Economy is most common and cost-effective. Business and First offer more comfort but cost significantly more.",
  
  // Search & Results (Flights)
  'best option': "I compare price, duration, stops, and overall value — not just the cheapest fare.\n\nTell me your route and dates, and I'll guide you.",
  'best value': "I compare price, duration, stops, and overall value — not just the cheapest fare.\n\nTell me your route and dates, and I'll guide you.",
  'cheaper': "Flight prices vary based on airline, route popularity, booking time, and fare class. However, when prices differ across currencies, it's often due to regional pricing models and currency conversion layers (bank FX margins, payment processing fees). This is legal price arbitrage—the base price may be similar, but the cost of converting and processing the payment changes. Ecovira shows multiple currencies so you can see these differences transparently.",
  'stops': "Stops occur when a flight doesn't have a direct route or when connecting is cheaper. Direct flights (0 stops) are fastest but may cost more. 1-stop flights offer a balance. 2+ stops are usually cheapest but take longer.",
  'stopover worth': "A stopover can be worth it if you save significantly on price and don't mind the extra travel time. For short trips, direct flights are usually better. For longer trips, a stopover can break up the journey. Check the AI Value Score for recommendations.",
  'fastest': "The fastest option is usually the direct flight (0 stops) with the shortest total duration. Check the AI Assist widget for 'Fastest' recommendation based on your search results.",
  'cheapest': "The cheapest option may have stops or less convenient times. Check the AI Assist widget for 'Cheapest' recommendation. Remember: cheapest isn't always best value—consider duration and convenience too.",
  'prices change': "Prices can change due to demand, availability, and airline pricing. Once you click 'Select Flight' and proceed to booking, we'll hold the price for a short period. Final pricing is confirmed at payment.",
  
  // Pricing & Fees
  'fees': "Ecovira shows total prices upfront before you pay. Any airline fees or payment charges are included at checkout — no surprises.\n\nAre you checking fees for a specific booking?",
  'fee': "Ecovira shows total prices upfront before you pay. Any airline fees or payment charges are included at checkout — no surprises.\n\nAre you checking fees for a specific booking?",
  'service fee': "Ecovira shows total prices upfront before you pay. Any airline fees or payment charges are included at checkout — no surprises.\n\nAre you checking fees for a specific booking?",
  'included in price': "The displayed price includes the base fare, taxes, and our 4% service fee. For flights, it's typically per person. For stays, it's usually per night. For cars, it's usually per day. Check the AI Assist widget for detailed breakdowns.",
  'why service fee': "The service fee supports our platform operations, including secure payment processing, customer support, booking management, and continuous platform improvements. It's a standard industry practice for online travel platforms.",
  'fee calculated': "The service fee is 4% of the base fare (before taxes). For example: if a flight costs 100 AUD total, the base is ~96.15 AUD and the fee is ~3.85 AUD. All prices shown include this fee.",
  'fee refundable': "The service fee is generally non-refundable, but if the airline cancels or you're eligible for a full refund, we'll process it accordingly. Refund policies depend on the fare type and airline rules.",
  'per person or total': "For flights, prices are typically per person. For stays, prices are usually per night. For cars, prices are usually per day. The AI Assist widget shows total trip costs clearly.",
  'price different': "Prices may differ from airline/hotel sites due to: our aggregated search across multiple providers, real-time availability, currency conversion, and our service fee. Additionally, prices can differ across currencies due to regional pricing models and currency conversion layers (bank FX margins, payment processing fees). This is legal price arbitrage—not a loophole—where regional pricing and payment rails affect the final cost. Ecovira shows multiple currencies transparently so you can see these differences. We aim to show competitive, transparent pricing.",
  'price change currency': "When you switch currencies, prices are converted using current exchange rates. However, the actual cost can differ due to regional pricing models and currency conversion layers. Airlines and hotels often price differently by region, and when you view or pay in another currency, you may avoid certain bank FX margins or regional markups. This is legal price arbitrage—not a loophole—where the base price is similar, but the cost of converting and processing the payment changes. Ecovira shows multiple currencies transparently so you can see these differences.",
  
  // Currency & Payments
  'currency crypto': "Prices can change depending on currency and payment method. In some cases, paying in a different currency or with crypto can reduce costs.\n\nAre you comparing options or ready to book?",
  'currency': "Prices can change depending on currency and payment method. In some cases, paying in a different currency or with crypto can reduce costs.\n\nAre you comparing options or ready to book?",
  'crypto': "Prices can change depending on currency and payment method. In some cases, paying in a different currency or with crypto can reduce costs.\n\nAre you comparing options or ready to book?",
  'pay in another currency': "Yes! We support multiple currencies: AUD, USD, EUR, GBP, TRY, AED, SAR, QAR, KWD, INR, THB, MYR, SGD, JPY, KRW. Select your preferred currency in the search panel.",
  'support crypto': "Yes! We accept cryptocurrencies: USDT, USDC, BTC, and ETH. Select your preferred cryptocurrency in the currency selector. All crypto payments are processed securely.",
  'crypto cheaper': "Crypto doesn't change airline prices directly, but it can reduce bank conversion layers. In some international bookings, paying with crypto or stablecoins avoids card FX margins. However, network fees and volatility still apply, so it's not always cheaper. This is part of currency arbitrage—the base price is the same, but the payment processing cost changes. Ecovira's approach is to explain both the benefits and the limits so you can decide safely. Stablecoins (USDT, USDC) reduce volatility risk compared to BTC/ETH, but network fees still apply.",
  'exchange rate': "We use real-time exchange rates from reputable financial data providers. Rates update frequently to reflect current market conditions. The rate is locked when you proceed to payment. Exchange rates fluctuate, so prices in different currencies will vary—the actual value remains the same, but the displayed amount changes based on current rates.",
  
  // Tickets & Booking
  'after select flight': "After clicking 'Select Flight': 1) You'll see a booking summary with flight details and total price, 2) Enter passenger details (name, email, phone, optional SMS opt-in), 3) Choose payment method (card or crypto), 4) Complete secure payment, 5) Receive instant confirmation email with e-ticket and booking reference. The booking is then processed automatically with the airline.",
  'when get ticket': "You'll receive your e-ticket via email immediately after successful payment. The email includes your booking reference, flight details, and instructions for check-in. Save this email for your records. You can also access your booking anytime via My Trips using your booking reference and last name.",
  'e-ticket': "Yes, all bookings receive e-tickets (electronic tickets) sent to your email. You can use the e-ticket for check-in and boarding. No physical tickets are required for most airlines. The e-ticket includes your booking reference (PNR) and all flight details.",
  'confirmed booking': "Yes, once payment is successful, your booking is confirmed. You'll receive a confirmation email with your booking reference. This is a real, confirmed reservation with the airline/hotel. The booking is processed automatically—it may take a moment to confirm with the supplier, but you'll receive updates via email.",
  'booking takes time': "Bookings are processed automatically after payment. Most confirm within seconds, but some may take a few minutes if the airline's system is busy. You'll receive email updates when the booking is confirmed. If there's an issue, we'll notify you immediately and process a refund if needed.",
  'price changes booking': "If the price changes during booking, we'll show you the updated price before payment. You can choose to proceed or cancel. Once payment is successful, the price is locked. If the airline's price increases significantly after payment but before confirmation, we'll notify you and offer options (pay difference, cancel with refund, or find alternative).",
  'booking fails': "If a booking fails after payment, we'll automatically process a full refund to your original payment method. You'll receive email confirmation of the refund. This is rare, but can happen if the airline's system rejects the booking or inventory changes. Contact support if you have concerns.",
  'hold fare': "We don't currently offer fare holds. Prices can change, so we recommend booking when you're ready. However, during the booking process, we'll hold the price for a short period while you complete payment. Once payment is successful, the price is locked.",
  'details needed': "We need: passenger names (as on passport/ID), date of birth, contact email and phone, payment details. For international flights, passport information may be required. You can optionally provide phone number and opt-in for SMS updates (booking confirmations, check-in reminders, departure alerts). All information is kept secure and encrypted.",
  
  // Changes, Cancellations & Refunds
  'refunds': "Refunds depend on the airline and the fare type you choose. Some tickets are fully refundable, others allow changes with a fee, and some are non-refundable.\n\nAre you asking about a booking you already made, or a flight you're planning to book?",
  'refund': "Refunds depend on the airline and the fare type you choose. Some tickets are fully refundable, others allow changes with a fee, and some are non-refundable.\n\nAre you asking about a booking you already made, or a flight you're planning to book?",
  'refundable': "Refunds depend on the airline and the fare type you choose. Some tickets are fully refundable, others allow changes with a fee, and some are non-refundable.\n\nAre you asking about a booking you already made, or a flight you're planning to book?",
  'refund policy': "Refunds depend on the airline and the fare type you choose. Some tickets are fully refundable, others allow changes with a fee, and some are non-refundable.\n\nAre you asking about a booking you already made, or a flight you're planning to book?",
  'change flight': "Flight changes depend on the fare type. Flexible fares usually allow changes (fees may apply). Basic fares may not allow changes. Check your booking confirmation for specific policies. Contact us for assistance.",
  'miss flight': "If you miss your flight, contact the airline immediately. Depending on the fare type, you may be able to rebook (fees apply) or use the value toward a future booking. We can help coordinate with the airline.",
  'refunds work': "Refunds are processed back to your original payment method. Processing time: credit/debit cards 5-10 business days, cryptocurrencies vary by network. We'll confirm when the refund is initiated.",
  'refunds take': "Refund processing time: credit/debit cards typically 5-10 business days, cryptocurrencies vary by network (can be faster). The airline must approve the refund first, which can take 1-3 business days.",
  'airline cancels': "If the airline cancels, you're entitled to a full refund or rebooking at no extra cost. We'll notify you immediately and process the refund automatically. You may also be eligible for compensation depending on regulations.",
  
  // Baggage & Seating
  'baggage included': "Baggage allowance varies by airline and fare class. Economy typically includes 1 carry-on (7kg) and 1 checked bag (23kg). Premium classes may include more. Check airline details in the flight card or booking confirmation.",
  'how many bags': "Standard allowance: 1 carry-on (7kg) and 1 checked bag (23kg) for economy. Premium classes may include 2 checked bags. You can usually add extra baggage during booking or later (fees apply).",
  'cabin vs checked': "Carry-on (cabin) baggage stays with you (typically 7kg, fits overhead). Checked baggage goes in the cargo hold (typically 23kg, larger items). Most fares include both, but check your specific booking.",
  'choose seat': "Seat selection is usually available during booking or after confirmation (fees may apply for preferred seats). Some airlines include free seat selection, others charge. Check your booking options.",
  'add baggage later': "Yes, you can usually add baggage after booking through the airline's website or by contacting us. Fees apply and may be higher than booking initially. We recommend adding it during booking when possible.",
  
  // Travel Rules & Practical Info
  'need visa': "Visa requirements depend on your nationality and destination. We don't provide visa advice—please check with the destination country's embassy or use official visa information services. We can help you find resources.",
  'documents needed': "For domestic flights: valid ID. For international: passport (valid for 6+ months), visa if required, any health certificates or travel authorizations. Check destination country requirements before travel.",
  'international or domestic': "International flights cross country borders and require passports. Domestic flights stay within one country and typically only need ID. Your booking confirmation will indicate the flight type.",
  'arrive early': "Recommended arrival: domestic flights 2 hours before, international flights 3 hours before. This allows time for check-in, security, and potential delays. Some airports recommend even earlier during peak times.",
  'transit rules': "For transit flights, you may need to: collect and re-check baggage (check with airline), go through security again, and have valid documents for the transit country. Some countries require transit visas.",
  
  // Stays (Hotels)
  'price include stays': "Hotel prices typically include the room rate and taxes. Breakfast, resort fees, and other amenities may be extra—check the property details. The AI Assist widget shows total cost breakdown.",
  'breakfast included': "Breakfast inclusion varies by property and rate type. Some rates include breakfast, others don't. Check the property details in the results. You can filter for 'breakfast included' in your search.",
  'refundable stays': "Refund policies vary: flexible rates are usually refundable (free cancellation), non-refundable rates offer lower prices but no refunds. Check the rate type when booking. Cancellation deadlines apply.",
  'pay now or later': "Both options are usually available. 'Pay now' often offers better rates. 'Pay later' lets you pay at the property. Check the rate type—some require immediate payment, others allow later payment.",
  'check-in times': "Standard check-in: 2-3 PM, check-out: 10-11 AM. Times vary by property. Early check-in and late check-out may be available (fees or free, depending on availability). Contact the property directly.",
  'cancel or change dates': "Flexible rates allow free cancellation/date changes (within policy deadlines). Non-refundable rates typically don't allow changes. Contact us or the property for assistance with modifications.",
  'extra taxes or fees': "Some properties charge resort fees, city taxes, or service charges not included in the displayed price. These are usually shown during booking. The AI Assist widget helps estimate total costs.",
  'price per night or total': "Prices are usually per night. The AI Assist widget shows total trip cost (nights × rate + taxes). Check the booking summary for the complete total before payment.",
  'how many guests': "Guest capacity is shown in the property details. Standard rooms typically accommodate 2 adults. Larger rooms or suites accommodate more. Extra guests may incur additional fees—check property policies.",
  'hotel good value': "Value depends on location, amenities, reviews, and price. The AI Assist widget can help compare options. Consider: star rating, guest reviews, location convenience, and included amenities.",
  
  // Cars
  'included rental price': "Rental prices typically include the base rate and basic insurance. Additional coverage, GPS, child seats, and extras cost extra. The AI Assist widget shows total rental estimate including insurance.",
  'insurance included': "Basic insurance (CDW/LDW) is usually included, but it may have a high excess/deductible. You can purchase additional coverage to reduce or eliminate the excess. Check the rental terms.",
  'excess mean': "Excess (deductible) is the amount you pay if the car is damaged, even if not your fault. Basic insurance has higher excess. Full coverage reduces or eliminates excess. Check your rental agreement.",
  'credit card': "Yes, a credit card is usually required for the security deposit/hold. Debit cards may be accepted at some locations. The hold is released after the car is returned undamaged. Check rental terms.",
  'age requirement': "Most rental companies require drivers to be 21-25+ (varies by location and company). Drivers under 25 may pay a young driver surcharge. International license may be required—check requirements.",
  'return different location': "One-way rentals (return to different location) are often available but may incur additional fees. Check the rental options during booking. Some locations don't allow one-way rentals.",
  'late return': "Late returns may incur additional charges (hourly or daily rates). Contact the rental company immediately if you'll be late. Some companies offer grace periods (e.g., 1 hour) before charging.",
  
  // Transfers
  'private or shared': "Transfer types vary: private (just you/your party) or shared (with other passengers). Private is more expensive but more convenient. Check the transfer details in the results.",
  'find driver': "You'll receive driver contact details and meeting point instructions via email after booking. Drivers typically meet you at arrivals with a name board. Contact the transfer company if needed.",
  'flight delayed': "Most transfer companies monitor flight delays and adjust pickup times automatically. Contact the transfer company with your new arrival time if needed. Some companies offer free rebooking for delays.",
  'luggage included transfers': "Yes, standard luggage (1-2 suitcases per person) is usually included. Extra or oversized luggage may incur fees. Check the transfer details for specific luggage policies.",
  'refundable transfers': "Transfer refund policies vary. Many allow free cancellation up to 24-48 hours before. Check the cancellation policy when booking. Contact us for assistance with cancellations.",
  'door to door': "Most transfers are door-to-door (airport to your address or hotel). Some may have designated pickup points. Check the transfer details for specific pickup and drop-off locations.",
  
  // AI Value Score & Insights
  'value score': "The Ecovira AI Value Score (0-100) evaluates options based on: Price Fairness (35%), Duration Efficiency (25%), Stops Penalty (25%), and Departure Convenience (15%). Higher scores = better overall value.",
  'score low': "A low score means the option is expensive relative to others, has long duration, many stops, or inconvenient times. Check the breakdown in AI Assist to see which factors are lowering the score.",
  'score high': "A high score means excellent value: competitive price, efficient duration, few/no stops, and convenient timing. This is our recommended option for best overall value.",
  'price fairness calculated': "Price Fairness compares the option's price to all available options. Lower prices score higher. If an option costs 50% more than the cheapest, it gets a lower fairness score.",
  'co2 estimate mean': "CO₂ estimate shows the approximate carbon emissions for the journey (in kg). Direct flights usually have lower emissions than flights with stops. This helps you make environmentally conscious choices.",
  'not recommended': "An option may not be recommended if it has: very high price, very long duration, many stops, or very inconvenient times. The AI Assist widget explains why and suggests better alternatives.",
  'improve score': "To improve the score: consider alternative dates (prices vary), choose direct flights if time-sensitive, or accept slightly longer duration for better price. The AI Assist widget provides specific tips.",
  
  // After Booking - My Trips & Tracking
  'my trips': "You can view bookings, track flights, and manage details in My Trips once your ticket is confirmed.\n\nDo you already have a booking reference?",
  'booking': "You can view bookings, track flights, and manage details in My Trips once your ticket is confirmed.\n\nDo you already have a booking reference?",
  'bookings': "You can view bookings, track flights, and manage details in My Trips once your ticket is confirmed.\n\nDo you already have a booking reference?",
  'access booking': "You can view bookings, track flights, and manage details in My Trips once your ticket is confirmed.\n\nDo you already have a booking reference?",
  'booking reference': "Your booking reference (e.g., ECV1A2B3C) is sent in your confirmation email. Use it with your last name to access My Trips. The reference is unique to your booking and appears on all communications.",
  'track flight': "Flight tracking shows live status from Amadeus API: on-time/delayed/cancelled, estimated departure/arrival times, gate/terminal info, baggage belt (if available), and last updated timestamp. Access it via My Trips → select your trip → Flight Status section. Status auto-refreshes every 5 minutes, or tap 'Refresh' manually.",
  'flight status': "Flight status shows: departure/arrival airports, scheduled vs estimated times, gate and terminal (when available), baggage belt (arrival), and current status (on-time, delayed, cancelled, boarding, departed, arrived). Status is best-effort and depends on live data availability from Amadeus. If unavailable, we show scheduled times.",
  'check in': "Online check-in is done directly with the airline, usually 24–48 hours before departure.\n\nI can guide you to the correct check-in page and help you prepare what you need.\n\nDo you already have a booking reference, or are you checking in for an upcoming flight?",
  'check-in': "Online check-in is done directly with the airline, usually 24–48 hours before departure.\n\nI can guide you to the correct check-in page and help you prepare what you need.\n\nDo you already have a booking reference, or are you checking in for an upcoming flight?",
  'check in opens': "Check-in usually opens 24-48 hours before departure (varies by airline). The check-in hub in My Trips shows a countdown when you're within the window. When open, tap 'Check-in Now' to go to the airline's official check-in page. You'll need your booking reference (PNR) and last name.",
  'check in need': "For check-in, you'll usually need your booking reference and last name, exactly as on the ticket. For international flights, passport details may be required. Seat selection and baggage options are usually shown during check-in.",
  'seat selection': "Seat selection and baggage options are usually shown during check-in. Some airlines charge for seat selection depending on fare type. You'll see available seats and prices when you check in.",
  'boarding pass': "Once check-in is completed, your boarding pass will be available by email or in the airline app. You can usually choose between mobile boarding passes or printed versions.",
  'notifications': "You'll receive automated emails: 1) Booking confirmed (immediately after payment), 2) Check-in opens soon (24 hours before check-in opens), 3) Check-in open (when check-in becomes available), 4) Departure reminder (3 hours before departure). If you opted in for SMS, you'll also receive text messages for these events. All notifications include links to My Trips.",
  'email notifications': "Email notifications are sent automatically: booking confirmed (immediately), check-in opens soon (24h before check-in opens), check-in open (when available), departure reminder (3h before). All emails include your booking reference and link to My Trips. Check your spam folder if you don't receive them.",
  'sms notifications': "SMS notifications are optional and require opt-in at checkout. If you opted in, you'll receive short text messages for: booking confirmed, check-in opens, check-in open, and departure reminder. SMS includes booking reference and link to My Trips. You can opt out anytime by replying STOP or contacting support.",
  'airline rules': "Ecovira can guide you to check-in, track flights, and send reminders, but we cannot control airline policies. Refunds, changes, baggage rules, and check-in deadlines depend on the airline and fare type. We'll help you understand policies and coordinate with airlines when needed, but final terms come from the airline.",
  
  // Platform & Trust
  'ecovira legit': "Yes, Ecovira Air is a legitimate travel booking platform. We partner with established providers (Amadeus, airlines, hotels) to offer real, confirmed bookings. We're committed to transparency and customer service.",
  'who runs': "Ecovira Air is operated by a dedicated team focused on providing premium travel booking experiences. We work with industry-leading partners to ensure reliable, secure bookings.",
  'secure': "Yes, we use industry-standard encryption (SSL/TLS) for all data transmission. Payment processing is handled by secure, PCI-compliant payment gateways. Your information is protected.",
  'payments protected': "All payments are processed through secure, encrypted channels. We use PCI-compliant payment processors. Your card details are never stored on our servers—they're handled by secure payment gateways.",
  'store card details': "No, we don't store your full card details on our servers. Payment information is processed securely through encrypted payment gateways. Only necessary booking information is retained for your account. We also never store wallet private keys—crypto payments are processed securely without storing sensitive wallet information.",
  'data safe': "Yes, we take data security seriously. We use encryption, secure servers, and follow industry best practices. We only collect necessary information for bookings and don't sell your data to third parties.",
  'why book here': "We offer: aggregated search across multiple providers, transparent pricing with AI insights, 24/7 support, multiple payment options (including crypto), and a premium booking experience. Compare and decide what's best for you.",
  
  // Help & Support
  'contact support': "You can reach our support team via: the chat widget (24/7), email (support@ecovira.com), or phone (check our contact page). We're here to help with bookings, changes, and any questions.",
  'human help': "Yes! While I'm an AI assistant, our human support team is available 24/7 for complex issues, booking modifications, and personalized assistance. Use the chat widget or contact information to reach them.",
  'something goes wrong': "If something goes wrong, contact us immediately via chat, email, or phone. We'll work with the airline/hotel/provider to resolve the issue. We're committed to making things right.",
  'report issue': "Report issues via: the chat widget, email (support@ecovira.com), or our contact form. Include your booking reference and details. We'll investigate and respond promptly.",
  'see booking': "After booking, you'll receive a confirmation email with your booking reference. You can also access your booking through your account (if you created one) or contact us with your reference number.",
};

export function EcoviraChatWidget({ context, isOpen: controlledIsOpen, onClose }: EcoviraChatWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  // REMOVED: shouldShow gating - panel now renders directly based on isOpen
  // REMOVED: Event listeners - now using Zustand store via controlled isOpen prop
  // REMOVED: Auto-hide on scroll - not needed with Zustand store
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: "Hi, I'm Ecovira AI 👋\n\nI help you find the best flights, prices, and booking options.\n\nAsk me anything or choose a quick option below."
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [quickChips, setQuickChips] = useState<string[]>([
    "Best option?",
    "Fees?",
    "Refunds?",
    "Baggage?",
    "Seat selection?",
    "Currency/Crypto?",
  ]);

  // Convert context to brain format
  const brainContext = useMemo(() => convertContextToBrainContext(context), [context]);

  // Auto-scroll to latest message when new messages arrive
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [isOpen, messages.length]);

  // Safety checks - refuse prohibited requests
  function shouldRefuse(userMessage: string): string | null {
    // Safe text helper to prevent crashes
    const safeText = (v: unknown) => (typeof v === "string" ? v : "");
    const raw = safeText(userMessage ?? "");
    const lowerInput = raw.toLowerCase().trim();
    
    // Guard: if input is empty, return early
    if (!lowerInput) {
      return null; // Empty input is handled by handleSend, not here
    }
    
    // Investment advice
    const investmentKeywords = ['invest', 'buy crypto', 'sell crypto', 'hold crypto', 'trading', 'price will', 'price prediction', 'crypto will go', 'crypto will rise', 'crypto will fall', 'stake', 'yield', 'speculate', 'should i buy', 'should i sell'];
    if (investmentKeywords.some(keyword => lowerInput.includes(keyword))) {
      return "I can explain how crypto works as a payment method, but I can't provide investment or trading advice. For investment decisions, please consult a qualified financial advisor.";
    }
    
    // Sensitive data requests
    const sensitiveDataKeywords = ['card number', 'credit card', 'wallet key', 'private key', 'password', 'pin', 'cvv', 'security code', 'passport number', 'passport no', 'id number', 'national id', 'drivers license number'];
    if (sensitiveDataKeywords.some(keyword => lowerInput.includes(keyword))) {
      return "For your security, never share sensitive payment, wallet, or ID details. We never ask for card numbers, passwords, private keys, or passport numbers. All payments are processed securely through encrypted channels.";
    }
    
    // Illegal requests
    const illegalKeywords = ['fraud', 'chargeback', 'fake', 'bypass', 'exploit', 'hack', 'scam', 'illegal'];
    if (illegalKeywords.some(keyword => lowerInput.includes(keyword))) {
      return "I can't help with that. For booking or payment concerns, contact our support team for assistance.";
    }
    
    return null;
  }

  const handleSend = async (query?: string) => {
    const userMessage = query || input.trim();
    if (!userMessage || sending) return;

    // Safe text helper to prevent crashes
    const safeText = (v: unknown) => (typeof v === "string" ? v : "");
    const raw = safeText(userMessage ?? "");
    const lowerInput = raw.toLowerCase().trim();
    
    // Guard: if input is empty after trimming, return helpful message
    if (!lowerInput) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Tell me what you need help with — flights, fees, refunds, baggage, seats, or currency/crypto payments." 
      }]);
      if (!query) setInput('');
      return;
    }

    // Safety check
    const refusal = shouldRefuse(userMessage);
    if (refusal) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: refusal }]);
      if (!query) setInput('');
      return;
    }

    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    if (!query) setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          history: messages.slice(-12), // Last 12 messages for context
          context: brainContext,
        }),
      });

      const data = await res.json();
      const reply = (data?.replyText ?? "Sorry — I couldn't generate a response right now.").trim();
      
      // Update quick chips if provided
      if (data?.quickChips && Array.isArray(data.quickChips)) {
        setQuickChips(data.quickChips);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('[EcoviraChatWidget] Error calling brain API:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I hit a connection issue. Try again — and if it keeps happening, email us at ecoviranalytics35@mgail.com",
      }]);
    } finally {
      setSending(false);
    }
  };

  // Removed debug logging to prevent hydration warnings


  return (
    <>
      {/* Chat Panel - Exact Structure - Deterministic: if isOpen is true, show it */}
      {isOpen && (
        <div 
          ref={chatPanelRef}
          className="fixed bottom-6 right-6 z-[999999] w-[420px] max-w-[92vw] pointer-events-auto"
          style={{
            visibility: 'visible',
            opacity: 1,
            pointerEvents: 'auto',
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999999
          }}
        >
          <div className="flex flex-col rounded-2xl border border-white/15 bg-[#0B0D10]/95 shadow-[0_24px_80px_rgba(0,0,0,0.70)] backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-[#0B0D10]/98 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold text-base">24/7 AI Assistant</div>
                <div className="text-white/60 text-sm">Always here to help</div>
              </div>
              <button
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    setInternalIsOpen(false);
                  }
                }}
                className="w-9 h-9 grid place-items-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY – FIXED HEIGHT */}
            <div className="flex flex-col h-[70vh] max-h-[640px] min-h-[420px]">
              {/* SCROLLABLE MESSAGES – ONLY THIS SCROLLS */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 text-white/90 ec-chat-messages-scrollbar bg-gradient-to-b from-[#0B0D10]/40 via-transparent to-transparent"
                style={{
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  minHeight: 0,
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex mb-3",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-4 py-3 text-[13.5px] leading-relaxed",
                        msg.role === 'user'
                          ? "bg-[rgba(28,140,130,0.22)] border border-[rgba(28,140,130,0.35)] text-white"
                          : "bg-[rgba(255,255,255,0.06)] border border-white/10 text-white/90"
                      )}
                    >
                      {renderMarkdown(msg.content)}
                    </div>
                  </div>
                ))}
                {/* Auto-scroll target */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chips row */}
              {quickChips.length > 0 && (
                <div className="px-4 pb-2 overflow-x-auto whitespace-nowrap bg-[#0B0D10]/75">
                  {quickChips.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSend(c)}
                      className="inline-flex mr-2 mt-2 px-3 py-1.5 rounded-full border border-[rgba(28,140,130,0.35)] bg-[rgba(28,140,130,0.12)] text-white text-xs hover:bg-[rgba(28,140,130,0.20)] transition"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT – FIXED */}
              <div className="border-t border-white/10 px-4 py-3 bg-[#0B0D10]/98">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                    placeholder="Ask me anything..."
                    className="flex-1 h-11 px-4 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                    disabled={sending}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={sending || !input.trim()}
                    className="h-11 px-4 rounded-lg bg-[rgba(28,140,130,0.20)] border border-[rgba(28,140,130,0.35)] text-white hover:bg-[rgba(28,140,130,0.28)] transition disabled:opacity-60"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating "Open Chat" Button - Show when manually closed */}
      {/* REMOVED: This button is no longer needed since we use Zustand store and FloatingActions button */}

    </>
  );
}

