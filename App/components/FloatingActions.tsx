"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function FloatingActions() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:13',message:'[FloatingActions] Component mounted - useEffect started',data:{mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'A'})}).catch(()=>{});
  }, []);
  // #endregion

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:19',message:'[FloatingActions] useEffect callback executing - setting mounted=true',data:{beforeMounted:mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    setMounted(true);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:22',message:'[FloatingActions] setMounted(true) called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, []);

  // Check DOM element visibility after mount
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    
    // #region agent log
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(container);
    const parentComputedStyle = container.parentElement ? window.getComputedStyle(container.parentElement) : null;
    
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:34',message:'[FloatingActions] DOM element visibility check',data:{mounted,elementExists:!!container,rect:{top:rect.top,right:rect.right,bottom:rect.bottom,left:rect.left,width:rect.width,height:rect.height},computedStyle:{display:computedStyle.display,visibility:computedStyle.visibility,opacity:computedStyle.opacity,zIndex:computedStyle.zIndex,position:computedStyle.position},parentOverflow:parentComputedStyle?.overflow,viewportHeight:window.innerHeight,viewportWidth:window.innerWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Check if buttons are actually visible in viewport
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      const btnRect = btn.getBoundingClientRect();
      const btnStyle = window.getComputedStyle(btn);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:44',message:'[FloatingActions] Button visibility check',data:{buttonIndex:idx,buttonText:btn.textContent,rect:{top:btnRect.top,right:btnRect.right,bottom:btnRect.bottom,left:btnRect.left,width:btnRect.width,height:btnRect.height},computedStyle:{display:btnStyle.display,visibility:btnStyle.visibility,opacity:btnStyle.opacity,zIndex:btnStyle.zIndex,position:btnStyle.position,backgroundColor:btnStyle.backgroundColor,color:btnStyle.color},isInViewport:btnRect.top >= 0 && btnRect.left >= 0 && btnRect.bottom <= window.innerHeight && btnRect.right <= window.innerWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    });
  }, [mounted]);

  // Check for z-index conflicts
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    
    // #region agent log
    const checkZIndexLayering = () => {
      const container = containerRef.current!;
      const containerZ = parseInt(window.getComputedStyle(container).zIndex || '0');
      const elements = document.elementsFromPoint(window.innerWidth - 100, window.innerHeight - 100);
      const zIndexInfo = elements.slice(0, 5).map(el => ({
        tag: el.tagName,
        className: el.className,
        zIndex: window.getComputedStyle(el).zIndex,
        position: window.getComputedStyle(el).position,
        id: el.id
      }));
      
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:58',message:'[FloatingActions] Z-index layering check',data:{containerZIndex:containerZ,elementsAtButtonPosition:zIndexInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'C'})}).catch(()=>{});
    };
    
    // Check immediately and after a short delay to catch any async layout
    checkZIndexLayering();
    setTimeout(checkZIndexLayering, 100);
    setTimeout(checkZIndexLayering, 500);
    // #endregion
  }, [mounted]);

  // #region agent log
  if (!mounted) {
    console.log('[FloatingActions] Early return - not mounted', { mounted });
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:71',message:'[FloatingActions] Early return - not mounted',data:{mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'A'})}).catch(()=>{});
    return null;
  }

  console.log('[FloatingActions] Rendering buttons JSX', { mounted });
  fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:75',message:'[FloatingActions] Rendering buttons JSX',data:{mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-40 right-6 z-[10000] flex flex-col gap-3"
      style={{
        position: 'fixed',
        bottom: '160px', // Position above chat widget (24px) and FloatingAiAssist (96px), with space for 2 buttons (~108px)
        right: '24px',
        zIndex: 10000,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* #region agent log */}
      {(() => {
        fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:90',message:'[FloatingActions] About to render AI Assistant button',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'E'})}).catch(()=>{});
        return null;
      })()}
      {/* #endregion */}
      <button
        type="button"
        className="rounded-full px-4 py-3 font-semibold bg-white/10 border border-white/15 backdrop-blur hover:bg-white/15 text-white"
        onClick={() => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:96',message:'[FloatingActions] AI Assistant button clicked',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          // Fire a global event that your chat widget listens to
          window.dispatchEvent(new CustomEvent("ecovira:chat:open"));
          console.log("[FloatingActions] Open chat clicked");
        }}
      >
        24/7 AI Assistant
      </button>

      {/* #region agent log */}
      {(() => {
        fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:106',message:'[FloatingActions] About to render My Trips button',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'E'})}).catch(()=>{});
        return null;
      })()}
      {/* #endregion */}
      <button
        type="button"
        className="rounded-full px-4 py-3 font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 text-black hover:opacity-90"
        onClick={() => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FloatingActions.tsx:112',message:'[FloatingActions] My Trips button clicked',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'button-visibility',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.log("[FloatingActions] My Trips clicked");
          router.push("/my-trips");
        }}
      >
        My Trips
      </button>
    </div>
  );
}

