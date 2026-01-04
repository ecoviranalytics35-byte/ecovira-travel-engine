import { NextRequest } from "next/server";
import { ecoviraBrain } from "@/lib/ai/ecovira-brain/brain";
import type { BrainInput } from "@/lib/ai/ecovira-brain/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BrainInput;

    const out = ecoviraBrain(body);

    // In production, omit debug
    return Response.json({
      replyText: out.replyText,
      quickChips: out.quickChips,
      debug: process.env.NODE_ENV === "development" ? out.debug : undefined,
    });
  } catch (error) {
    console.error("[chat/route] Error:", error);
    return Response.json(
      {
        replyText: "I encountered an error. Please try again or contact support.",
        quickChips: ["Best option?", "Fees?", "Refunds?"],
      },
      { status: 500 }
    );
  }
}

