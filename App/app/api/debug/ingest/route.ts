import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug ingest endpoint - always returns 200, non-blocking
 * In development, optionally forwards to local logger server at 127.0.0.1:7243
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
  // Optionally forward to local logger in development only
  if (process.env.NODE_ENV === 'development') {
    try {
      const logData = await request.json();
      const loggerUrl = 'http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1';
      
      // Forward to local logger asynchronously (fire and forget)
      // Don't await - this should never block the response
      fetch(loggerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      }).catch(() => {
        // Silently ignore errors - logger may not be running
      });
    } catch (error) {
      // Silently ignore parsing errors
    }
  }
  
  // Always return success immediately
  return NextResponse.json({ success: true }, { status: 200 });
}

