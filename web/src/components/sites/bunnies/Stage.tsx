"use client";

import { useEffect, useState } from "react";
import { Scene } from "./Scene";

/**
 * Fixed 3D backdrop plus the loading screen. The page content stays hidden (like the source)
 * until the scene has loaded its models, with a fallback so content never stays hidden.
 */
export function Stage() {
  const [ready, setReady] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (ready) return;
    const t0 = performance.now();
    const id = window.setInterval(() => {
      // Eases towards 90% while waiting, then jumps to 100% when the scene reports ready.
      const k = 1 - Math.exp(-(performance.now() - t0) / 1500);
      setPct(Math.round(k * 90));
    }, 50);
    const fallback = window.setTimeout(() => setReady(true), 8000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(fallback);
    };
  }, [ready]);

  useEffect(() => {
    document.documentElement.classList.toggle("fof-ready", ready);
  }, [ready]);

  return (
    <>
      <div className="pwb-background pwb-flex-grid-wrap" id="ip1j">
        <Scene onReady={() => setReady(true)} />
      </div>
      <div className={`fof-loader${ready ? " done" : ""}`} aria-hidden={ready}>
        <div className="fof-ring-wrap">
          <i className="fof-ring" style={{ ["--p" as string]: ready ? 100 : pct }} />
          <span>{ready ? 100 : pct}%</span>
        </div>
      </div>
    </>
  );
}
