"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, MessageCircle } from 'lucide-react';
import { EcoviraCard } from '../EcoviraCard';
import { cn } from '../../lib/utils';

interface EcoviraChatWidgetProps {
  context?: {
    page?: 'flights' | 'stays' | 'cars' | 'transfers';
    route?: { from?: string; to?: string };
    dates?: { depart?: string; return?: string };
    passengers?: number;
    cabin?: string;
    currency?: string;
    topFlights?: Array<{ price: string; duration: string; stops: string; from: string; to: string }>;
    selectedFlight?: any;
    results?: any[];
  };
  isOpen?: boolean;
  onClose?: () => void;
}

// Dynamic quick chips based on page context
const getQuickChips = (page?: string) => {
  const baseChips = [
    { label: 'Best option?', query: 'Which option is best and why?' },
    { label: 'Fees?', query: 'What is the service fee?' },
    { label: 'Refunds?', query: 'What is the refund policy?' },
    { label: 'Currency/Crypto?', query: 'Can I pay with cryptocurrency?' },
  ];

  if (page === 'flights') {
    return [
      ...baseChips,
      { label: 'Baggage?', query: 'What is the baggage allowance?' },
      { label: 'Value Score?', query: 'What is the AI Value Score?' },
    ];
  } else if (page === 'stays') {
    return [
      ...baseChips,
      { label: 'Breakfast?', query: 'Is breakfast included?' },
      { label: 'Check-in?', query: 'What are check-in times?' },
    ];
  } else if (page === 'cars') {
    return [
      ...baseChips,
      { label: 'Insurance?', query: 'Is insurance included?' },
      { label: 'Age limit?', query: 'What is the age requirement?' },
    ];
  } else if (page === 'transfers') {
    return [
      ...baseChips,
      { label: 'Private?', query: 'Is this private or shared?' },
      { label: 'Delays?', query: 'What if my flight is delayed?' },
    ];
  }

  return baseChips;
};

// SYSTEM PROMPT — Ecovira AI Assistant
const ECOVIRA_SYSTEM_PROMPT = `You are Ecovira AI, a transparent, ethical travel and finance assistant built into the Ecovira travel engine.

Your role is to help users make smarter, fairer, and more cost-efficient decisions, even if that means recommending options that reduce company profit.

You are deeply familiar with how Ecovira works internally:
- Search & Navigation: You know how to search flights, stays, cars, and transfers. You understand one-way vs round-trip, filters, dates, passengers, cabin class, and all search parameters.
- Pricing & Fees: You understand base fare vs taxes vs Ecovira's 4% service fee. You know why prices differ between options, why prices change with time/availability, and what "per person" vs "total" means.
- Currency Intelligence: You understand why prices can be cheaper in different currencies, how currency conversion & arbitrage works (legally & transparently), when crypto may or may not be cheaper, and that Ecovira shows prices honestly.
- AI Value & Recommendations: You know what "best value" means, the difference between cheapest/fastest/balanced, why the AI recommends one option over another, and when the AI warns about poor value.
- Booking Process: You know what happens after clicking "Select Flight" (booking summary → passenger details → payment → confirmation → booking automation). You understand why bookings may take a moment to confirm and what happens if a price changes or fails.
- After Booking: You know how to access My Trips (booking reference + last name), how flight tracking works (live status from Amadeus API), how check-in works (guidance + airline link), and email notifications (confirmation, check-in opens, departure reminders).
- Safety & Transparency: You know refunds depend on airline fare rules, Ecovira does not store card or wallet private keys, AI insights are advisory not guarantees, and Ecovira acts ethically and transparently.

You must:
- Always explain prices, fees, and currencies honestly
- Educate users about how exchange rates, currencies, and timing affect cost
- Warn users when an option is poor value
- Encourage smarter alternatives (dates, routes, currencies) when appropriate
- Never hide fees or manipulate choices
- Never exaggerate savings or guarantee cheaper outcomes
- Answer engine-related questions immediately and correctly without asking for clarification
- Guide users through the platform without confusion
- Sound like Ecovira's built-in expert, not a generic help bot

Ecovira's philosophy:
- Transparency over profit
- Education over exploitation
- Fair value over impulse booking

Ecovira Currency & Arbitrage Intelligence:

When users ask why prices are cheaper in different currencies, you must explain that:
- Airlines, hotels, and suppliers often price differently by region
- Currency conversion layers (banks, cards, FX margins) affect totals
- Viewing or paying in certain currencies can reduce intermediary costs
- This is a form of legal price arbitrage, not a loophole
- Savings are situational, not guaranteed

Ecovira definition of arbitrage (consumer-safe):
Price differences created by regional pricing models, currency conversion layers, and payment rails — not exploitation.

You must connect:
- Currency choice
- FX margins
- Payment method (bank vs crypto)
- Regional pricing logic

When discussing currency:
- Explain why prices differ (regional pricing, FX margins, payment layers)
- Clarify that exchange rates fluctuate
- State when crypto may reduce intermediary fees
- Never claim a currency is "always cheaper"
- Always explain the arbitrage logic, not just generic travel explanations

Crypto Currency Intelligence:
- Treat crypto as a payment method, not a guaranteed savings tool
- Explain that savings depend on FX fees, network fees, and volatility
- Warn users when crypto may not be cost-effective
- Avoid speculation or investment language
- Clearly explain differences between stablecoins and volatile crypto
- Encourage informed decisions, not hype
- Never claim crypto is always cheaper
- Never guarantee savings
- Never encourage risky behaviour

Tone: Calm, supportive, clear, professional, non-salesy. If information is uncertain, say so. If data is estimated, label it clearly. You are a trusted advisor, not a salesperson.

Confidence & Proactive Behavior (CRITICAL):
- You are deeply familiar with Ecovira's platform, pricing logic, AI Value Score, currency strategy, booking process, My Trips, flight tracking, check-in, notifications, and ethical framework
- You should respond confidently and proactively, not defensively or uncertainly
- Answer first, even if the question is broad - make reasonable assumptions using page context
- Only ask follow-up questions after giving value (at most ONE follow-up, only if truly needed)
- If the user asks anything remotely related to price, value, options, strategy, search, booking, tracking, or check-in, you must respond with insight, not a clarification request
- Avoid asking users to rephrase unless the question is completely unrelated or unsafe
- If a question is broad, answer it using available context, then offer optional follow-ups
- When users ask "where can I search" or "how do I search", provide direct, actionable guidance based on the current page context
- Never say "I don't understand" without helping - always provide value first
- Stay calm, confident, and clear - you are Ecovira's built-in expert

Hard Refusal & Safety Rules

You must refuse to provide:
- Financial or investment advice
- Crypto price predictions or trading guidance
- Guarantees of savings, prices, refunds, or availability
- Legal or immigration advice
- Airline policy guarantees
- Requests for sensitive personal or payment data
- Manipulative sales pressure or urgency
- Assistance with fraud or illegal activity

When refusing:
- Be calm, transparent, and supportive
- Offer safe, educational alternatives where possible
- Never shame or judge the user
- Your role is to protect users, not persuade them.`;

// Comprehensive FAQ responses covering all topics
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
  'best option': "The best option depends on your priorities. Check the AI Assist widget (bottom-right) for Value Score, Best Options, and actionable tips. Generally: cheapest for budget, fastest for time-sensitive, best value for balance of price, duration, and convenience.",
  'best value': "Best value means the optimal balance of price, duration, stops, and convenience. Our AI Value Score (0-100) calculates this automatically. Higher scores indicate better overall value, not just the cheapest price.",
  'cheaper': "Flight prices vary based on airline, route popularity, booking time, and fare class. However, when prices differ across currencies, it's often due to regional pricing models and currency conversion layers (bank FX margins, payment processing fees). This is legal price arbitrage—the base price may be similar, but the cost of converting and processing the payment changes. Ecovira shows multiple currencies so you can see these differences transparently.",
  'stops': "Stops occur when a flight doesn't have a direct route or when connecting is cheaper. Direct flights (0 stops) are fastest but may cost more. 1-stop flights offer a balance. 2+ stops are usually cheapest but take longer.",
  'stopover worth': "A stopover can be worth it if you save significantly on price and don't mind the extra travel time. For short trips, direct flights are usually better. For longer trips, a stopover can break up the journey. Check the AI Value Score for recommendations.",
  'fastest': "The fastest option is usually the direct flight (0 stops) with the shortest total duration. Check the AI Assist widget for 'Fastest' recommendation based on your search results.",
  'cheapest': "The cheapest option may have stops or less convenient times. Check the AI Assist widget for 'Cheapest' recommendation. Remember: cheapest isn't always best value—consider duration and convenience too.",
  'prices change': "Prices can change due to demand, availability, and airline pricing. Once you click 'Select Flight' and proceed to booking, we'll hold the price for a short period. Final pricing is confirmed at payment.",
  
  // Pricing & Fees
  'included in price': "The displayed price includes the base fare, taxes, and our 4% service fee. For flights, it's typically per person. For stays, it's usually per night. For cars, it's usually per day. Check the AI Assist widget for detailed breakdowns.",
  'service fee': "We charge a 4% service fee on all bookings. This covers platform maintenance, secure payment processing, 24/7 customer support, and booking management. The fee is transparently displayed in all price breakdowns.",
  'why service fee': "The service fee supports our platform operations, including secure payment processing, customer support, booking management, and continuous platform improvements. It's a standard industry practice for online travel platforms.",
  'fee calculated': "The service fee is 4% of the base fare (before taxes). For example: if a flight costs 100 AUD total, the base is ~96.15 AUD and the fee is ~3.85 AUD. All prices shown include this fee.",
  'fee refundable': "The service fee is generally non-refundable, but if the airline cancels or you're eligible for a full refund, we'll process it accordingly. Refund policies depend on the fare type and airline rules.",
  'per person or total': "For flights, prices are typically per person. For stays, prices are usually per night. For cars, prices are usually per day. The AI Assist widget shows total trip costs clearly.",
  'price different': "Prices may differ from airline/hotel sites due to: our aggregated search across multiple providers, real-time availability, currency conversion, and our service fee. Additionally, prices can differ across currencies due to regional pricing models and currency conversion layers (bank FX margins, payment processing fees). This is legal price arbitrage—not a loophole—where regional pricing and payment rails affect the final cost. Ecovira shows multiple currencies transparently so you can see these differences. We aim to show competitive, transparent pricing.",
  'price change currency': "When you switch currencies, prices are converted using current exchange rates. However, the actual cost can differ due to regional pricing models and currency conversion layers. Airlines and hotels often price differently by region, and when you view or pay in another currency, you may avoid certain bank FX margins or regional markups. This is legal price arbitrage—not a loophole—where the base price is similar, but the cost of converting and processing the payment changes. Ecovira shows multiple currencies transparently so you can see these differences.",
  
  // Currency & Payments
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
  'change flight': "Flight changes depend on the fare type. Flexible fares usually allow changes (fees may apply). Basic fares may not allow changes. Check your booking confirmation for specific policies. Contact us for assistance.",
  'refundable': "Refund policies vary by airline and fare type. Flexible fares are usually refundable (minus fees). Basic fares may be non-refundable. Full refunds are typically available if the airline cancels. Check your booking details.",
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
  'my trips': "My Trips is where you access your bookings after confirmation. Go to /my-trips and enter your booking reference (from confirmation email) and last name. You'll see all your trips with flight details, status, and links to track flights and check in.",
  'access booking': "Access your booking via My Trips (/my-trips). Enter your booking reference (e.g., ECV1A2B3C) and last name (as on booking). You'll see trip details, flight tracking, check-in hub, and booking status. No account login required—just booking reference + last name.",
  'booking reference': "Your booking reference (e.g., ECV1A2B3C) is sent in your confirmation email. Use it with your last name to access My Trips. The reference is unique to your booking and appears on all communications.",
  'track flight': "Flight tracking shows live status from Amadeus API: on-time/delayed/cancelled, estimated departure/arrival times, gate/terminal info, baggage belt (if available), and last updated timestamp. Access it via My Trips → select your trip → Flight Status section. Status auto-refreshes every 5 minutes, or tap 'Refresh' manually.",
  'flight status': "Flight status shows: departure/arrival airports, scheduled vs estimated times, gate and terminal (when available), baggage belt (arrival), and current status (on-time, delayed, cancelled, boarding, departed, arrived). Status is best-effort and depends on live data availability from Amadeus. If unavailable, we show scheduled times.",
  'check in': "Check-in hub is in My Trips. It shows: check-in window countdown (usually opens 24-48 hours before departure), 'Check-in Now' button (deep links to airline's official check-in page), and what you'll need (booking reference/PNR, last name, passport for international). We guide you to the airline's check-in page—we don't complete check-in ourselves.",
  'check in opens': "Check-in usually opens 24-48 hours before departure (varies by airline). The check-in hub in My Trips shows a countdown when you're within the window. When open, tap 'Check-in Now' to go to the airline's official check-in page. You'll need your booking reference (PNR) and last name.",
  'check in need': "For check-in, you'll need: booking reference (PNR) or ticket number, last name (as on booking), and passport details (for international travel). The airline's check-in page will guide you through seat selection, baggage options, and boarding pass download.",
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
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  // Also listen for global events as fallback (for uncontrolled mode)
  useEffect(() => {
    if (controlledIsOpen === undefined) {
      const handleOpen = () => setInternalIsOpen(true);
      const handleClose = () => setInternalIsOpen(false);
      
      window.addEventListener('ecovira-chat-open', handleOpen);
      window.addEventListener('ecovira-chat-close', handleClose);
      
      return () => {
        window.removeEventListener('ecovira-chat-open', handleOpen);
        window.removeEventListener('ecovira-chat-close', handleClose);
      };
    }
  }, [controlledIsOpen]);
  
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { 
      role: 'assistant', 
      content: context 
        ? `Hi, I'm Ecovira AI 👋\n\nI'm your built-in travel expert. I understand how Ecovira works—search, pricing, currency strategies, booking, My Trips, flight tracking, and check-in.\n\nI can help you:\n• Find the best options and value\n• Understand pricing, fees, and currency arbitrage\n• Navigate the booking process\n• Access My Trips and track flights\n• Get check-in guidance\n\nAsk me anything, or tap one of the quick questions below to get started.`
        : "Hi, I'm Ecovira AI 👋\n\nI'm your built-in travel expert. I understand how Ecovira works—search, pricing, currency strategies, booking, My Trips, flight tracking, and check-in.\n\nI can help you:\n• Find the best options and value\n• Understand pricing, fees, and currency arbitrage\n• Navigate the booking process\n• Access My Trips and track flights\n• Get check-in guidance\n\nAsk me anything, or tap one of the quick questions below to get started."
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (query?: string) => {
    const userMessage = query || input.trim();
    if (!userMessage) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    if (!query) setInput('');

    // Context-aware response generation
    const lowerInput = userMessage.toLowerCase();
    let response = "I understand you're asking about that. I'll guide you with what's available. For more specific assistance, our human support team is available 24/7 via this chat or email. How else can I help?";
    
    // HARD REFUSAL BOUNDARIES - Check for prohibited requests FIRST
    let refused = false;
    
    // 1. Financial & Investment Advice (STRICT NO)
    const investmentKeywords = ['invest', 'buy crypto', 'sell crypto', 'hold crypto', 'trading', 'price will', 'price prediction', 'crypto will go', 'crypto will rise', 'crypto will fall', 'stake', 'yield', 'speculate', 'should i buy', 'should i sell'];
    if (investmentKeywords.some(keyword => lowerInput.includes(keyword))) {
      response = "I can explain how crypto works as a payment method, but I can't provide investment or trading advice. For investment decisions, please consult a qualified financial advisor. I'm here to help with travel bookings and payment options.";
      refused = true;
    }
    
    // 2. Guarantees & Absolute Claims (STRICT NO)
    const guaranteeKeywords = ['guarantee', 'always cheaper', 'will save', 'guaranteed refund', 'guaranteed price', 'promise', 'definitely', 'certainly will'];
    if (!refused && guaranteeKeywords.some(keyword => lowerInput.includes(keyword)) && 
        (lowerInput.includes('save') || lowerInput.includes('cheaper') || lowerInput.includes('refund') || lowerInput.includes('price'))) {
      response = "Savings depend on exchange rates and availability, which can change. I can't guarantee specific outcomes, but I can explain how pricing and refunds typically work based on current policies.";
      refused = true;
    }
    
    // 3. Legal, Immigration & Visa Advice (LIMITED)
    const legalKeywords = ['visa eligibility', 'legal advice', 'immigration law', 'guarantee entry', 'will i get visa', 'can i enter'];
    if (!refused && legalKeywords.some(keyword => lowerInput.includes(keyword))) {
      response = "I can share general travel information, but for legal or visa matters it's best to check official government sources or consult an immigration lawyer. I can help you find the right resources if needed.";
      refused = true;
    }
    
    // 4. Airline Policy Guarantees (LIMITED)
    if (!refused && (lowerInput.includes('guarantee') || lowerInput.includes('promise')) && 
        (lowerInput.includes('refund') || lowerInput.includes('change') || lowerInput.includes('airline'))) {
      response = "Policies depend on the airline and fare class. I can explain general rules, but final terms come from the airline. Check your booking confirmation or contact the airline directly for specific policy details.";
      refused = true;
    }
    
    // 5. User Data & Security (ABSOLUTE NO)
    const sensitiveDataKeywords = ['card number', 'credit card', 'wallet key', 'private key', 'password', 'pin', 'cvv', 'security code'];
    if (!refused && sensitiveDataKeywords.some(keyword => lowerInput.includes(keyword))) {
      response = "For your security, never share sensitive payment or wallet details. We never ask for card numbers, passwords, or private keys. All payments are processed securely through encrypted channels. If you need help with payment, I can explain the secure booking process.";
      refused = true;
    }
    
    // 6. Manipulative or Sales Pressure (ABSOLUTE NO)
    const pressureKeywords = ['book now or', 'limited time', 'last chance', 'hurry', 'urgent', 'act fast', 'don\'t miss'];
    if (!refused && pressureKeywords.some(keyword => lowerInput.includes(keyword)) && 
        lowerInput.includes('book')) {
      response = "I'm here to help you make informed decisions at your own pace. There's no pressure to book immediately. Take your time to compare options and choose what's best for you. I can help you understand pricing and options whenever you're ready.";
      refused = true;
    }
    
    // 7. Unsafe / Illegal Requests (STANDARD REFUSAL)
    const illegalKeywords = ['fraud', 'chargeback', 'fake', 'bypass', 'exploit', 'hack', 'scam', 'illegal'];
    if (!refused && illegalKeywords.some(keyword => lowerInput.includes(keyword))) {
      response = "I can't help with that, but I'm happy to guide you with legitimate booking and payment options. If you have concerns about a booking or payment, I can help you contact our support team for assistance.";
      refused = true;
    }
    
    // 8. Medical Advice (STANDARD NO)
    const medicalKeywords = ['medical advice', 'diagnose', 'treatment', 'prescription', 'medicine', 'sick', 'illness'];
    if (!refused && medicalKeywords.some(keyword => lowerInput.includes(keyword)) && 
        (lowerInput.includes('travel') || lowerInput.includes('flight'))) {
      response = "I can't provide medical advice. For travel health questions, please consult a healthcare professional or travel medicine clinic. I can help with general travel information and booking assistance.";
      refused = true;
    }
    
    // If request was refused, return early
    if (refused) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }, 500);
      return;
    }

    // Enhanced FAQ matching (check for multiple keywords)
    let matched = false;
    for (const [key, answer] of Object.entries(FAQ_RESPONSES)) {
      if (lowerInput.includes(key)) {
        response = answer;
        matched = true;
        break;
      }
    }

    // Context-specific intelligent responses
    if (context) {
      const page = context.page || 'flights';
      const hasResults = context.results && context.results.length > 0;
      const selected = context.selectedFlight || (hasResults ? context.results[0] : null);

      // Best option with context - PROACTIVE ECOVIRA-STYLE ANSWER
      if ((lowerInput.includes('best') || lowerInput.includes('recommend') || lowerInput.includes('which option')) && hasResults) {
        if (page === 'flights' && context.topFlights && context.topFlights.length > 0) {
          const cheapest = context.topFlights.reduce((min, f) => 
            parseFloat(f.price || 0) < parseFloat(min.price || 0) ? f : min, context.topFlights[0]
          );
          const fastest = context.topFlights.reduce((min, f) => {
            const minDur = parseFloat(min.duration || '999') || 999;
            const fDur = parseFloat(f.duration || '999') || 999;
            return fDur < minDur ? f : min;
          }, context.topFlights[0]);
          
          // Find best value (middle-priced option that balances price and duration)
          const sortedByPrice = [...context.topFlights].sort((a, b) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
          const middleIndex = Math.floor(sortedByPrice.length / 2);
          const bestValue = sortedByPrice[middleIndex] || sortedByPrice[0];
          
          const cheapestPrice = parseFloat(cheapest.price || '0');
          const fastestPrice = parseFloat(fastest.price || '0');
          const bestValuePrice = parseFloat(bestValue.price || '0');
          const priceDiff = Math.abs(cheapestPrice - fastestPrice);
          const priceDiffPercent = cheapestPrice > 0 ? Math.round((priceDiff / cheapestPrice) * 100) : 0;
          
          response = `Based on the options currently shown for ${context.route?.from || ''} → ${context.route?.to || ''}, here's my analysis:\n\n` +
            `**Best Value:** The middle-priced option (${bestValue.price} ${context.currency || 'USD'}) balances price and duration. ` +
            `It's not the cheapest, but it avoids an extra stop, which reduces risk and travel time.\n\n` +
            `**Other options:**\n` +
            `💰 Cheapest: ${cheapest.price} ${context.currency || 'USD'} (${cheapest.duration || 'N/A'} duration, ${cheapest.stops || '0'} stops)\n` +
            `⚡ Fastest: ${fastest.price} ${context.currency || 'USD'} (${fastest.duration || 'N/A'} duration, ${fastest.stops || '0'} stops)`;
          
          if (priceDiffPercent > 30) {
            response += `\n\n**Insight:** The fastest option is ${priceDiffPercent}% more expensive. ` +
              `If time isn't critical, the cheapest option offers significant savings, but consider the trade-off: more stops or less convenient timing.`;
          }
          
          response += `\n\nOpen the AI Assist widget (bottom-right) for detailed Value Scores and "Best Value" recommendations. ` +
            `If you want, I can also compare it against the cheapest option or check how currency choice affects the total.`;
          matched = true;
        } else if (page === 'stays' && hasResults) {
          const bestValue = context.results.reduce((best, s) => {
            const bestPrice = parseFloat(best.total || '0');
            const sPrice = parseFloat(s.total || '0');
            return sPrice < bestPrice ? s : best;
          }, context.results[0]);
          response = `Based on your search, ${bestValue.name || 'this option'} offers the best value at ${bestValue.currency || context.currency || 'USD'} ${bestValue.total || '0'} per night. Check the AI Assist widget for total trip cost and detailed insights.`;
          matched = true;
        }
      }

      // AI Value Score explanations
      if ((lowerInput.includes('score') || lowerInput.includes('value score')) && !matched) {
        if (selected && page === 'flights') {
          response = `The AI Value Score (0-100) evaluates flights based on:\n\n` +
            `• Price Fairness (35%): How competitive the price is\n` +
            `• Duration Efficiency (25%): How fast the journey is\n` +
            `• Stops Penalty (25%): Fewer stops = higher score\n` +
            `• Departure Convenience (15%): Time of day preference\n\n` +
            `Open the AI Assist widget (bottom-right) to see the exact score for ${selected.from || 'your'} → ${selected.to || 'destination'} and detailed breakdowns. Higher scores indicate better overall value.`;
        } else {
          response = "The AI Value Score (0-100) evaluates options based on price, duration, convenience, and other factors. Open the AI Assist widget (bottom-right) to see detailed scores for your current search results.";
        }
        matched = true;
      }

      // Service fee with currency context - ENHANCED WITH TRANSPARENCY
      if ((lowerInput.includes('fee') || lowerInput.includes('service fee')) && context.currency && !matched) {
        response = `Our service fee is 4% of the base fare. For example, if a ${page === 'flights' ? 'flight' : page === 'stays' ? 'stay' : page === 'cars' ? 'car rental' : 'transfer'} costs 100 ${context.currency}, the base is ~96.15 ${context.currency} and the fee is ~3.85 ${context.currency}. ` +
          `All prices shown include this fee transparently—we never hide costs. ` +
          `This fee supports platform operations, secure payment processing, 24/7 customer support, and booking management. ` +
          `It's a standard industry practice, and we're upfront about it so you can make informed decisions.`;
        matched = true;
      }

      // Selected flight/option specific questions - ENHANCED WITH VALUE WARNINGS
      if (selected && (lowerInput.includes('this') || lowerInput.includes('selected'))) {
        if (lowerInput.includes('worth') || lowerInput.includes('good') || lowerInput.includes('value')) {
          const allPrices = context.results?.map((r: any) => parseFloat(r.price || '0')).filter((p: number) => p > 0) || [];
          const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
          const selectedPrice = parseFloat(selected.price || '0');
          const isExpensive = minPrice > 0 && selectedPrice > minPrice * 1.3;
          
          response = `For ${selected.from || 'this option'} → ${selected.to || 'destination'}, check the AI Assist widget for the Value Score. ` +
            `The score considers price (${selected.price || 'N/A'} ${context.currency || 'USD'}), duration, stops, and convenience. `;
          
          if (isExpensive) {
            response += `\n\n**Honest Assessment:** This option is priced ${Math.round(((selectedPrice / minPrice) - 1) * 100)}% higher than the cheapest option. ` +
              `While it may have better timing or fewer stops, the price premium is significant. ` +
              `Higher scores (70+) indicate good value—lower scores suggest you might find better options by adjusting dates or considering alternatives. ` +
              `I recommend checking the AI Assist widget for "Best Value" recommendations that balance price and convenience.`;
          } else {
            response += `Higher scores (70+) indicate good value. Lower scores suggest you might find better options by adjusting dates or considering alternatives.`;
          }
          matched = true;
        } else if (lowerInput.includes('why') && lowerInput.includes('price')) {
          const allPrices = context.results?.map((r: any) => parseFloat(r.price || '0')).filter((p: number) => p > 0) || [];
          const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
          const selectedPrice = parseFloat(selected.price || '0');
          const isExpensive = minPrice > 0 && selectedPrice > minPrice * 1.3;
          
          response = `The price for ${selected.from || 'this'} → ${selected.to || 'destination'} (${selected.price || 'N/A'} ${context.currency || 'USD'}) reflects: ` +
            `airline pricing, route demand, booking timing, and fare class. `;
          
          if (isExpensive) {
            response += `\n\n**Transparency:** This option is ${Math.round(((selectedPrice / minPrice) - 1) * 100)}% more expensive than the cheapest option. ` +
              `This is likely due to peak demand, route popularity, or booking timing. ` +
              `However, currency arbitrage might help: viewing or paying in another currency could reveal regional pricing differences or reduce bank FX margins. ` +
              `This is legal price arbitrage—the base price is similar, but currency conversion layers and payment rails affect the final cost. ` +
              `Consider alternative dates or routes, and check if switching currencies reveals better regional pricing. ` +
              `The AI Assist widget shows how this compares to other options.`;
          } else {
            response += `\n\n**Currency Arbitrage Note:** The price also reflects currency conversion layers (bank FX margins, payment processing fees) and regional pricing models. ` +
              `Viewing or paying in another currency may reduce intermediary costs through legal price arbitrage, but it depends on exchange rates, payment method, and timing. ` +
              `Compare with other options in your results—the AI Assist widget shows if this is competitive or expensive relative to alternatives.`;
          }
          matched = true;
        }
      }

      // Route and trip context
      if (context.route && (lowerInput.includes('route') || lowerInput.includes('searching') || lowerInput.includes('trip'))) {
        response = `You're searching ${context.route.from || '?'} → ${context.route.to || '?'}. ` +
          `${context.dates?.depart ? `Departure: ${context.dates.depart}` : ''} ` +
          `${context.dates?.return ? `Return: ${context.dates.return}` : ''}. ` +
          `${context.passengers ? `${context.passengers} passenger(s)` : ''} ` +
          `${context.cabin ? `, ${context.cabin} class` : ''}. ` +
          `${hasResults ? `You have ${context.results.length} result(s) available.` : 'Search to see available options.'}`;
        matched = true;
      }

      // Currency arbitrage questions - ECOVIRA-STYLE EXPLANATION
      if ((lowerInput.includes('arbitrage') || lowerInput.includes('why cheaper') || lowerInput.includes('cheaper in') || lowerInput.includes('currency arbitrage')) && !matched) {
        response = `Great question — this comes down to how global pricing and currency conversion work.\n\n` +
          `**Ecovira Currency Arbitrage Explained:**\n\n` +
          `Airlines and hotels often set prices differently by region, and when you view or pay in another currency, you may avoid certain bank FX margins or regional markups.\n\n` +
          `This is a form of legal price arbitrage — not a loophole — where the base price is the same, but the cost of converting and processing the payment changes.\n\n` +
          `**How it works:**\n` +
          `• Regional pricing models: Suppliers price differently by market\n` +
          `• Currency conversion layers: Banks and cards add FX margins\n` +
          `• Payment rails: Different payment methods have different processing costs\n` +
          `• Viewing in another currency: Can reveal regional pricing differences\n\n` +
          `Ecovira shows multiple currencies so you can see these differences transparently. Sometimes it helps, sometimes it doesn't — it depends on exchange rates, payment method, and timing.\n\n` +
          `My role is to help you spot when it makes sense and when it doesn't.`;
        matched = true;
      }
      
      // Currency/crypto questions with context - ENHANCED WITH ARBITRAGE INTELLIGENCE
      if ((lowerInput.includes('currency') || lowerInput.includes('crypto')) && context.currency && !matched) {
        const isCrypto = context.currency === 'USDT' || context.currency === 'USDC' || context.currency === 'BTC' || context.currency === 'ETH';
        
        if (lowerInput.includes('crypto') || isCrypto) {
          // Crypto arbitrage intelligence
          response = `You're currently viewing prices in ${context.currency}. ` +
            `\n\n**Crypto Payment & Arbitrage Intelligence:**\n\n` +
            `Crypto doesn't change airline prices directly, but it can reduce bank conversion layers.\n\n` +
            `In some international bookings, paying with crypto or stablecoins avoids card FX margins. However, network fees and volatility still apply, so it's not always cheaper.\n\n` +
            `**How crypto arbitrage works:**\n` +
            `• Base price: Same regardless of payment method\n` +
            `• Bank FX margins: Avoided with crypto payments\n` +
            `• Network fees: Still apply (varies by blockchain)\n` +
            `• Volatility: Stablecoins (USDT, USDC) reduce risk vs BTC/ETH\n\n` +
            `Ecovira's approach is to explain both the benefits and the limits so you can decide safely. ` +
            `If your bank already offers strong FX rates, fiat may be just as cost-effective.\n\n` +
            `You can switch to other currencies (AUD, USD, EUR, GBP, TRY, AED, SAR, QAR, KWD, INR, THB, MYR, SGD, JPY, KRW) or cryptocurrencies (USDT, USDC, BTC, ETH) using the currency selector. ` +
            `Prices are converted using real-time exchange rates.`;
        } else {
          // Fiat currency arbitrage intelligence
          response = `You're currently viewing prices in ${context.currency}. ` +
            `\n\n**Currency Arbitrage Strategy:**\n\n` +
            `When prices differ across currencies, it's often due to:\n\n` +
            `**1. Regional Pricing Models:**\n` +
            `Airlines and hotels price differently by region. Viewing in another currency can reveal these differences.\n\n` +
            `**2. Currency Conversion Layers:**\n` +
            `Banks and cards add FX margins. Sometimes booking in the airline's base currency can reduce these conversion fees.\n\n` +
            `**3. Payment Rails:**\n` +
            `Different payment methods have different processing costs, which affects the final total.\n\n` +
            `**This is legal price arbitrage** — not a loophole — where the base price is similar, but the cost of converting and processing the payment changes.\n\n` +
            `Ecovira shows multiple currencies transparently so you can see these differences. ` +
            `Switching currency won't help if the base fare is expensive—consider alternative dates or routes instead.\n\n` +
            `You can switch to other currencies (AUD, USD, EUR, GBP, TRY, AED, SAR, QAR, KWD, INR, THB, MYR, SGD, JPY, KRW) or cryptocurrencies (USDT, USDC, BTC, ETH) using the currency selector. ` +
            `All prices use real-time exchange rates.`;
        }
        matched = true;
      }
      
      // "Why does Ecovira show multiple currencies?" question
      if ((lowerInput.includes('why') && lowerInput.includes('multiple currencies')) || 
          (lowerInput.includes('why') && lowerInput.includes('show currencies')) ||
          (lowerInput.includes('why') && lowerInput.includes('ecovira') && lowerInput.includes('currency'))) {
        response = `Ecovira shows multiple currencies for transparency and to help you understand currency arbitrage.\n\n` +
          `**Why we do this:**\n\n` +
          `**1. Transparency:**\n` +
          `We believe you should see how prices differ across currencies, not hide it.\n\n` +
          `**2. Currency Arbitrage Education:**\n` +
          `Airlines and hotels price differently by region. Currency conversion layers (bank FX margins, payment processing) affect totals. ` +
          `By showing multiple currencies, you can see when viewing or paying in another currency might reduce intermediary costs.\n\n` +
          `**3. Informed Decisions:**\n` +
          `This is legal price arbitrage—not a loophole. The base price is similar, but the cost of converting and processing the payment changes. ` +
          `We explain both the benefits and the limits so you can decide safely.\n\n` +
          `**4. Fair Value:**\n` +
          `Our philosophy is transparency over profit, education over exploitation. We'd rather you save money than push a sale.`;
        matched = true;
      }
      
      // Proactive currency advice when user asks about price
      if ((lowerInput.includes('price') || lowerInput.includes('expensive') || lowerInput.includes('cost')) && context.currency && !matched && hasResults) {
        const selected = context.selectedFlight || (hasResults ? context.results[0] : null);
        if (selected && page === 'flights') {
          const price = parseFloat(selected.price || '0');
          const allPrices = context.results.map((r: any) => parseFloat(r.price || '0')).filter((p: number) => p > 0);
          const avgPrice = allPrices.reduce((a: number, b: number) => a + b, 0) / allPrices.length;
          const minPrice = Math.min(...allPrices);
          const isExpensive = price > avgPrice * 1.2;
          
          response = `The price for ${selected.from || 'this'} → ${selected.to || 'destination'} is ${selected.price || 'N/A'} ${context.currency || 'USD'}. `;
          
          if (isExpensive && price > minPrice * 1.3) {
            response += `\n\n**Value Warning:** This option is priced ${Math.round(((price / minPrice) - 1) * 100)}% higher than the cheapest option. ` +
              `This may be due to peak demand, route popularity, or booking timing—not currency conversion. ` +
              `Switching currency won't help much here. Consider:\n` +
              `• Alternative dates (prices vary significantly by day)\n` +
              `• Different departure times\n` +
              `• Checking if a stopover route is available\n\n` +
              `The AI Assist widget (bottom-right) shows Value Scores and can recommend better options.`;
          } else if (lowerInput.includes('currency') || lowerInput.includes('why')) {
            response += `\n\n**Currency Arbitrage Impact:** The price reflects airline pricing, route demand, and booking timing. ` +
              `However, currency choice can affect the final cost through regional pricing models and currency conversion layers (bank FX margins, payment processing fees). ` +
              `This is legal price arbitrage—viewing or paying in another currency may reduce intermediary costs, but it depends on exchange rates, payment method, and timing. ` +
              `If this seems expensive, consider alternative dates or routes, and check if switching currencies reveals better regional pricing.`;
          } else {
            response += `Prices reflect airline pricing, route demand, booking timing, and fare class. ` +
              `Compare with other options in your results—the AI Assist widget shows if this is competitive.`;
          }
          matched = true;
        }
      }
    }

    // Search & Navigation questions - PROACTIVE GUIDANCE
    if ((lowerInput.includes('where') || lowerInput.includes('how')) && 
        (lowerInput.includes('search') || lowerInput.includes('find') || lowerInput.includes('book'))) {
      const page = context?.page || 'flights';
      if (page === 'flights') {
        response = "You can search for flights directly on this page. Enter your departure and destination airports (e.g., MEL, SYD), select dates, choose passengers and cabin class, then tap 'Search Flights' at the bottom.\n\n" +
          "Once results appear, I'll help you compare prices, value, and currency options. The AI Assist widget (bottom-right) shows Value Scores and recommendations.";
      } else if (page === 'stays') {
        response = "You can search for stays directly on this page. Enter the city name, check-in date, number of nights, adults, and children (if any), then tap 'Search Stays'.\n\n" +
          "Once results appear, I'll help you compare prices, total costs, and value. The AI Assist widget shows total trip cost estimates.";
      } else if (page === 'cars') {
        response = "You can search for cars directly on this page. Enter pickup location, pickup date and time, return date and time, and driver age, then tap 'Search Cars'.\n\n" +
          "Once results appear, I'll help you compare vehicles, prices, and rental terms.";
      } else if (page === 'transfers') {
        response = "You can search for transfers directly on this page. Enter pickup location, drop-off location, date, time, and passengers, then tap 'Search Transfers'.\n\n" +
          "Once results appear, I'll help you compare options and prices.";
      } else {
        response = "You can search directly on this page. Enter your travel details in the search panel, select your currency, then tap the search button.\n\n" +
          "Once results appear, I'll help you compare options, prices, and value. The AI Assist widget (bottom-right) provides detailed insights.";
      }
      matched = true;
    }

    // Fallback for unmatched queries - PROACTIVE RESPONSES (answer first, don't ask for clarification)
    if (!matched) {
      // Try to provide helpful guidance based on context
      if (lowerInput.includes('help') || lowerInput.includes('support')) {
        response = "I'm here to help! I'm Ecovira AI, your transparent travel and finance assistant. I can help with:\n\n" +
          "• Search & Navigation: How to search flights, stays, cars, transfers\n" +
          "• Best options and honest value assessments\n" +
          "• Pricing, fees, and currency strategies (including crypto)\n" +
          "• Booking process and tickets\n" +
          "• My Trips: Access bookings, track flights, check-in\n" +
          "• Email & SMS notifications\n" +
          "• Changes, cancellations, and refunds\n" +
          "• Baggage, seating, and travel rules\n" +
          "• AI Value Score and insights\n" +
          "• Platform security and trust\n\n" +
          "I'll always be transparent about costs and warn you about poor value—even if it means recommending options that save you money. " +
          "For complex issues, our human support team is available 24/7. What would you like to know?";
      } else if (context && context.results && context.results.length > 0) {
        // If we have results, provide proactive insight based on the question
        const page = context.page || 'flights';
        const selected = context.selectedFlight || context.results[0];
        
        if (lowerInput.includes('which') || lowerInput.includes('what') || lowerInput.includes('how')) {
          // Proactive answer using context
          if (page === 'flights' && selected) {
            response = `Based on your current search results, I can help you understand your options.\n\n` +
              `You have ${context.results.length} flight option(s) available. ` +
              `The AI Assist widget (bottom-right) shows Value Scores, Best Options, and actionable tips for each flight.\n\n` +
              `**Quick insights:**\n` +
              `• Check the Value Score to see which option offers the best balance of price, duration, and convenience\n` +
              `• Currency choice can affect the final cost through regional pricing and FX margins\n` +
              `• Consider alternative dates if prices seem high—prices vary significantly by day\n\n` +
              `Would you like me to explain the Value Score, compare specific options, or help with currency strategies?`;
          } else if (page === 'stays' && selected) {
            response = `Based on your current search, I can help you understand your accommodation options.\n\n` +
              `You have ${context.results.length} stay option(s) available. ` +
              `The AI Assist widget (bottom-right) shows total trip costs and value insights.\n\n` +
              `**Quick insights:**\n` +
              `• Compare total cost (nights × rate + taxes) across options\n` +
              `• Check cancellation policies—flexible rates may cost more but offer peace of mind\n` +
              `• Currency choice can reveal regional pricing differences\n\n` +
              `Would you like me to explain pricing, compare options, or help with currency strategies?`;
          } else {
            response = `I can help you understand your ${page} options. ` +
              `You have ${context.results.length} result(s) available. ` +
              `The AI Assist widget (bottom-right) provides detailed insights and value scores.\n\n` +
              `I can explain pricing, compare options, help with currency strategies, or answer questions about fees and booking. What would you like to know?`;
          }
        } else {
          // Generic proactive response with context
          response = `I understand you're asking about your ${page} search. ` +
            `You have ${context.results.length} option(s) available. ` +
            `I can help you:\n\n` +
            `• Compare options and explain value\n` +
            `• Understand pricing and currency strategies\n` +
            `• Explain fees and booking process\n` +
            `• Answer questions about the AI Value Score\n\n` +
            `What specific aspect would you like me to explain?`;
        }
      } else {
        // No context but still be proactive - DEFAULT RESPONSE PATTERN
        if (lowerInput.includes('where') || lowerInput.includes('how') || lowerInput.includes('what')) {
          // Broad question - provide engine-aware guidance
          response = `I can help you with your travel search. ` +
            `I understand Ecovira's platform, pricing logic, currency strategies, booking process, My Trips, flight tracking, check-in, and AI Value Score system.\n\n` +
            `I can explain:\n` +
            `• How to search flights, stays, cars, or transfers\n` +
            `• How to find the best options and value\n` +
            `• Pricing, fees, and currency arbitrage\n` +
            `• How crypto payments work\n` +
            `• The booking process (Select → Details → Payment → Confirmation)\n` +
            `• How to access My Trips and track flights\n` +
            `• Check-in process and airline links\n` +
            `• Email and SMS notifications\n` +
            `• AI Value Score and insights\n\n` +
            `Are you asking about Flights, Stays, Cars, or Transfers?`;
        } else {
          // Fallback Rule: If context is truly missing, use simple response
          response = `I can help with that. Are you asking about Flights, Stays, Cars, or Transfers?`;
        }
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };


  // Removed debug logging to prevent hydration warnings

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div 
          className="fixed z-[10000] flex flex-col" 
          style={{ 
            display: 'block', 
            visibility: 'visible', 
            opacity: 1,
            zIndex: 10000,
            position: 'fixed',
            top: '100px',
            right: '24px',
            width: '420px',
            height: '600px',
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 'calc(100vh - 120px)'
          }}
          ref={chatPanelRef}
        >
          <EcoviraCard variant="glass" className="flex-1 flex flex-col p-0 shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden bg-[rgba(15,17,20,0.92)] backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 border-b border-[rgba(28,140,130,0.22)] flex items-center justify-between bg-[rgba(21,24,29,0.98)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.3)] to-[rgba(28,140,130,0.2)] flex items-center justify-center">
                  <Bot size={20} className="text-ec-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ec-text">24/7 AI Assistant</h3>
                  <p className="text-xs text-ec-muted">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    setInternalIsOpen(false);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center text-ec-muted hover:text-ec-text hover:bg-[rgba(28,140,130,0.15)] rounded-ec-sm transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[rgba(15,17,20,0.75)]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-ec-md p-3 text-sm",
                      msg.role === 'user'
                        ? "bg-[rgba(28,140,130,0.25)] text-ec-text"
                        : "bg-[rgba(15,17,20,0.6)] text-ec-text border border-[rgba(28,140,130,0.15)]"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips - Dynamic based on page context */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 border-t border-[rgba(28,140,130,0.15)] bg-[rgba(15,17,20,0.75)]">
                <div className="flex flex-wrap gap-2 pt-3">
                  {getQuickChips(context?.page).map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(chip.query)}
                      className="ec-chat-quick-chip px-4 py-2 text-sm font-semibold bg-[rgba(28,140,130,0.25)] hover:bg-[rgba(28,140,130,0.4)] border-2 border-[rgba(28,140,130,0.5)] rounded-full text-white hover:text-white transition-all shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_20px_rgba(28,140,130,0.25)] hover:shadow-[0_0_18px_rgba(28,140,130,0.6),0_0_30px_rgba(28,140,130,0.4)] hover:border-[rgba(28,140,130,0.7)] hover:scale-105 active:scale-95"
                      style={{ color: '#FFFFFF' }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-[rgba(28,140,130,0.22)] bg-[rgba(21,24,29,0.98)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 h-11 px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text text-sm placeholder-[rgba(237,237,237,0.45)] focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)]"
                />
                <button
                  onClick={() => handleSend()}
                  className="w-11 h-11 bg-gradient-to-br from-[rgba(28,140,130,0.8)] to-[rgba(28,140,130,0.6)] border border-[rgba(200,162,77,0.3)] rounded-ec-md text-ec-text flex items-center justify-center hover:shadow-[0_0_12px_rgba(28,140,130,0.4)] transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </EcoviraCard>
        </div>
      )}

    </>
  );
}

