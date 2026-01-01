import { NextRequest, NextResponse } from 'next/server';

/**
 * Agent logging endpoint - only active when NEXT_PUBLIC_AGENT_LOG=1
 * Accepts POST requests with debug log data and writes to .cursor/debug.log
 */
export async function POST(request: NextRequest) {
  // Only process if agent logging is enabled
  if (process.env.NEXT_PUBLIC_AGENT_LOG !== '1') {
    return NextResponse.json({ success: false, message: 'Agent logging disabled' }, { status: 403 });
  }

  try {
    const logData = await request.json();
    
    // Write to debug.log file (NDJSON format)
    const fs = await import('fs/promises');
    const path = await import('path');
    const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
    
    // Ensure .cursor directory exists
    const cursorDir = path.join(process.cwd(), '.cursor');
    try {
      await fs.access(cursorDir);
    } catch {
      await fs.mkdir(cursorDir, { recursive: true });
    }
    
    // Append log entry as NDJSON (one JSON object per line)
    const logLine = JSON.stringify(logData) + '\n';
    await fs.appendFile(logPath, logLine, 'utf8');
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[agent-log] Error writing log:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

