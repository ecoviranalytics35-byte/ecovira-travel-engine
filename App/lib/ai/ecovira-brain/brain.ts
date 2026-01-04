import type { BrainInput, BrainOutput, TripContext } from "./types";
import { detectIntent } from "./intent";
import { ECOVIRA_KNOWLEDGE, ECOVIRA_CONTACT } from "./knowledge";
import { currencyAdvisor } from "./currency";
import { rankFlights } from "./scoring";
import { formatFeeBreakdown, summarizeRoute, flightOneLine } from "./format";

// Helper: ensure only one follow-up question max
function oneFollowUp(question: string, followUpUsed: { value: boolean }): string {
  if (followUpUsed.value) return "";
  followUpUsed.value = true;
  return question.trim().endsWith("?") ? question.trim() : `${question.trim()}?`;
}

function hasEnoughSearchContext(ctx?: TripContext) {
  return (ctx?.topFlights?.length ?? 0) >= 2;
}

export function ecoviraBrain(input: BrainInput): BrainOutput {
  const { userMessage, context } = input;
  const { intent, confidence } = detectIntent(userMessage);

  const followUpUsed = { value: false };
  const usedContextKeys: string[] = [];

  const routeSummary = summarizeRoute(context);
  if (routeSummary) usedContextKeys.push("route/dates/pax/cabin");

  const quickChips = ECOVIRA_KNOWLEDGE.defaultQuickChips.slice();

  // Core handlers
  if (intent === "contact_support") {
    const reply = [
      `You can reach Ecovira support at **${ECOVIRA_CONTACT.email}**.`,
      ``,
      `**Why**`,
      `- Our support team is available 24/7 to help with bookings, changes, refunds, and any questions.`,
      ``,
      `**Next step**`,
      `Email us with your booking reference (if you have one) and we'll respond promptly.`,
    ].join("\n");

    return {
      replyText: reply,
      quickChips,
      debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
    };
  }

  if (intent === "fees") {
    const b = context?.feeBreakdown;
    if (b && (b.total || b.baseFare || b.taxes)) {
      usedContextKeys.push("feeBreakdown");
      const lines = formatFeeBreakdown(b);
      const answer = [
        `Here's the fee breakdown${routeSummary ? ` for ${routeSummary}` : ""}:`,
        ...lines.map((l) => `- ${l}`),
        ``,
        `**Why**`,
        `- Ecovira shows the total upfront so you can see everything before payment.`,
        `- Add-ons like seats/bags can vary by fare type and airline.`,
        ``,
        `**Next step**`,
        `If you tell me whether you want **cheapest** or **more flexible** (refundable/changes), I'll recommend the best checkout path.`,
      ].join("\n");

      return {
        replyText: answer,
        quickChips,
        debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
      };
    }

    // No breakdown available
    usedContextKeys.push("feesExplainer");
    const q = oneFollowUp(
      "Are you checking fees for a specific flight you've selected, or just estimating before search",
      followUpUsed
    );

    const reply = [
      `Ecovira's total price is designed to be "no surprises" — it can include airline fare + taxes + any airline surcharges, and (if applicable) payment processing + an Ecovira service fee.`,
      ``,
      `**Why**`,
      `- Some extras (seat selection, checked baggage, insurance) depend on airline + fare type and may appear as optional add-ons.`,
      `- The cleanest way to confirm is to view the checkout breakdown for the exact option.`,
      ``,
      `**Next step**`,
      q || `Pick a flight option and I'll break down what's included.`,
    ].join("\n");

    return {
      replyText: reply,
      quickChips,
      debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
    };
  }

  if (intent === "best_option") {
    const options = context?.topFlights ?? [];
    if (options.length >= 2) {
      usedContextKeys.push("topFlights");
      const ranked = rankFlights(options);
      const best = ranked[0];
      const second = ranked[1];

      const answerLines: string[] = [];
      answerLines.push(
        `My top pick${routeSummary ? ` for ${routeSummary}` : ""}: **Option 1**`
      );
      answerLines.push(`- ${flightOneLine(best.option)}`);
      if (second) {
        answerLines.push(``);
        answerLines.push(`Strong alternative: **Option 2**`);
        answerLines.push(`- ${flightOneLine(second.option)}`);
      }

      const why: string[] = [
        `- Best overall balance of total price, travel time, and stops.`,
        ...(best.reasons.length ? best.reasons.slice(0, 3).map((r) => `- ${r}`) : []),
      ];

      const next = oneFollowUp(
        "Do you prefer the absolute cheapest, or do you want more flexibility (refund/changes)",
        followUpUsed
      );

      const reply = [
        answerLines.join("\n"),
        ``,
        `**Why**`,
        why.join("\n"),
        ``,
        `**Next step**`,
        next || `If you select Option 1, I'll confirm what's included (bags/seats/refundability) before checkout.`,
      ].join("\n");

      return {
        replyText: reply,
        quickChips,
        debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
      };
    }

    // Not enough options in context
    const q = oneFollowUp(
      "What route and dates are you considering (from/to + depart + return if any)",
      followUpUsed
    );

    const reply = [
      `I can recommend the best option once I can compare at least 2–3 results.`,
      ``,
      `**Why**`,
      `- "Best" depends on the trade-off: price vs travel time vs stops vs flexibility.`,
      ``,
      `**Next step**`,
      q || `Run a search and I'll rank the top options instantly.`,
    ].join("\n");

    return {
      replyText: reply,
      quickChips,
      debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
    };
  }

  if (intent === "refunds") {
    usedContextKeys.push("refundsExplainer");
    const selected = context?.selectedFlight;
    if (selected?.fareRules) usedContextKeys.push("selectedFlight.fareRules");

    const refundHint = selected?.fareRules?.refundable ?? selected?.refundable;
    const changeHint = selected?.fareRules?.changeable ?? selected?.changeable;

    const answer = [
      refundHint === true
        ? `This fare appears **refundable** (great for flexibility).`
        : refundHint === false
        ? `This fare appears **non-refundable** (but changes may still be possible).`
        : `Refundability depends on the airline's fare rules for the exact option.`,
      ``,
      `**Why**`,
      `- Airlines set refund/change rules by fare brand and route.`,
      `- Even non-refundable fares may allow changes with a fee + fare difference.`,
      ``,
      `**Next step**`,
      oneFollowUp(
        `Do you want "fully refundable", or is "changeable with a fee" acceptable`,
        followUpUsed
      ) || `Select a specific option and I'll confirm the exact fare rules.`,
    ].join("\n");

    return {
      replyText: answer,
      quickChips,
      debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
    };
  }

  if (intent === "baggage") {
    usedContextKeys.push("baggageExplainer");
    const selected = context?.selectedFlight;
    const bag = selected?.fareRules?.baggageIncluded;

    const reply = [
      bag
        ? `For your selected option, baggage looks like: **${bag}**.`
        : `Baggage depends on airline + fare type. Many basic fares include carry-on, while checked bags can be extra.`,
      ``,
      `**Why**`,
      `- Airlines price bags differently by route and fare brand.`,
      `- Seats and bags can be separate add-ons even if one is included.`,
      ``,
      `**Next step**`,
      oneFollowUp(
        `Are you travelling with checked luggage, or carry-on only`,
        followUpUsed
      ) || `If you pick a flight option, I'll confirm baggage for that exact fare.`,
    ].join("\n");

    return {
      replyText: reply,
      quickChips,
      debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
    };
  }

  if (intent === "seats") {
    const reply = [
      `Seat selection can be included or optional depending on the airline and fare brand. Premium/standard fares often allow free selection; basic fares may charge.`,
      ``,
      `**Why**`,
      `- Airlines treat seats as an ancillary product on many routes.`,
      `- Even if seat selection costs extra, you can still secure aisle/window early for peace of mind.`,
      ``,
      `**Next step**`,
      oneFollowUp(`Do you have a seat preference (aisle/window) and are you travelling as a group`, followUpUsed) ||
        `Select a flight option and I'll tell you the most cost-efficient way to choose seats.`,
    ].join("\n");

    return {
      replyText: reply,
      quickChips,
      debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
    };
  }

  if (intent === "payments_currency_crypto") {
    usedContextKeys.push("currencyAdvisor");
    const reply = currencyAdvisor(context, userMessage);

    const footer = `\n\nIf you need support, email **${ECOVIRA_CONTACT.email}**.`;
    return {
      replyText: reply + footer,
      quickChips,
      debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
    };
  }

  // General help: act like "mini Google" but grounded in the app context
  const reply = [
    `I can help with flights, fees, refunds, baggage, seat selection, and checkout — like a premium travel concierge.`,
    routeSummary ? `Current trip context: **${routeSummary}**` : ``,
    ``,
    `**Why**`,
    `- I can compare options, explain trade-offs, and guide the fastest path to a clean booking.`,
    ``,
    `**Next step**`,
    oneFollowUp(`What do you want to optimise for today — cheapest, fastest, or most flexible`, followUpUsed) ||
      `Pick a quick option below.`,
    ``,
    `If you need support, contact us at **${ECOVIRA_CONTACT.email}**.`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    replyText: reply,
    quickChips,
    debug: { intent, confidence, followUpUsed: followUpUsed.value, usedContextKeys },
  };
}

