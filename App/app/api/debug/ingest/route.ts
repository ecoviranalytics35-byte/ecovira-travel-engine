import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug ingest endpoint - always returns 200, non-blocking
 * All debug logging is now handled via console.log in development mode only
 * In production, silently succeeds to prevent any client-side errors
 */
export async function POST(request: NextRequest) {
  // #region agent log
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
    const logLine = JSON.stringify({location:'debug/ingest/route.ts:11',message:'[debug/ingest] POST called',data:{nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'fix-verification',hypothesisId:'A'}) + '\n';
    await fs.appendFile(logPath, logLine, 'utf8').catch(()=>{});
  } catch {}
  // #endregion
  
  // Always return 200 immediately - non-blocking
  // Debug endpoint - no longer forwards to local logger
  // All debug logging is now handled via console.log in development mode only
  
  // Always return success immediately
  return NextResponse.json({ success: true }, { status: 200 });
}

