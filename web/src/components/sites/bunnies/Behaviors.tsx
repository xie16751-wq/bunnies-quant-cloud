"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import uiState from "./ui-state.json";
import layout from "./layout.json";
import { scrollState, timelineProgress } from "./timeline";

const anchors = uiState.anchors as Record<string, { percentage: number }>;
const sectionIdByHash = layout.sectionIdByHash as Record<string, string>;

/** Spring towards `to` (stiffness 400, damping 30, mass 1 — the source's scroll-animation default). */
function springOpacity(el: HTMLElement, to: number) {
  const state = el as HTMLElement & { _spring?: number; _v?: number };
  cancelAnimationFrame(state._spring ?? 0);
  let x = parseFloat(getComputedStyle(el).opacity);
  let v = state._v ?? 0;
  let last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    const a = -400 * (x - to) - 30 * v;
    v += a * dt;
    x += v * dt;
    state._v = v;
    if (Math.abs(x - to) < 0.001 && Math.abs(v) < 0.001) {
      el.style.opacity = String(to);
      el.style.pointerEvents = to < Number.EPSILON ? "none" : "auto";
      state._v = 0;
      return;
    }
    el.style.opacity = String(Math.max(0, Math.min(1, x)));
    state._spring = requestAnimationFrame(step);
  };
  if (to > 0) el.style.pointerEvents = "auto";
  state._spring = requestAnimationFrame(step);
}

export function Behaviors() {
  useEffect(() => {
    // The source always starts at the top so the 3D timeline begins at 0.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    let raf = 0;
    const tick = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Scroll position → 3D timeline progress.
    const anchorEls = Object.keys(anchors)
      .map((id) => ({ el: document.getElementById(id), pct: anchors[id].percentage }))
      .filter((a): a is { el: HTMLElement; pct: number } => !!a.el);
    const updateProgress = () => {
      const doc = document.documentElement;
      scrollState.progress = timelineProgress(
        lenis.scroll,
        window.innerHeight,
        doc.scrollHeight,
        anchorEls.map((a) => ({ position: a.el.offsetTop, percentage: a.pct })),
      );
    };

    // Hero content fades out once the hero section has left the bottom edge of the viewport.
    const heroSection = document.getElementById("i84ba");
    const heroContent = document.getElementById("i1lwz");
    let heroState: "initial" | "entered" | "exited" = "entered";
    let heroCenterAtEnter = heroSection ? centre(heroSection) : 0;
    function centre(el: HTMLElement) {
      const r = el.getBoundingClientRect();
      return (r.top + r.bottom) / 2;
    }
    const updateHero = () => {
      if (!heroSection || !heroContent) return;
      const r = heroSection.getBoundingClientRect();
      const vh = window.innerHeight;
      const inside = r.top < vh && r.bottom >= vh - 0.5;
      if (inside && heroState !== "entered") {
        heroState = "entered";
        heroCenterAtEnter = centre(heroSection);
        springOpacity(heroContent, 1);
      } else if (!inside && heroState === "entered") {
        heroState = centre(heroSection) <= heroCenterAtEnter ? "exited" : "initial";
        if (heroState === "exited") springOpacity(heroContent, 0);
      }
    };

    const onScroll = () => {
      updateProgress();
      updateHero();
    };
    lenis.on("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    onScroll();

    // Feature-card rows scale in from 0.8 the first time half of each row is visible.
    const rows = ["i1lwz-2-4-2-2-3-4-3", "i1lwz-2-4-2-2-3-4-3-2", "i1lwz-2-4-2-2-3-4-3-2-2"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    rows.forEach((el) => {
      el.style.transform = "scale(0.8)";
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.transition = "transform 600ms cubic-bezier(0,0,0.58,1)";
          el.style.transform = "scale(1)";
          io.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );
    rows.forEach((el) => io.observe(el));

    // Builder links: internal ones smooth-scroll to their section, external ones open a new tab.
    const go = (target: HTMLElement) => {
      const href = target.dataset.link;
      if (!href) return;
      if (href.startsWith("#")) {
        const section = document.getElementById(sectionIdByHash[href.slice(1)] || "");
        if (section) lenis.scrollTo(section);
      } else if (/^https?:/.test(href)) {
        window.open(href, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = href; // same-site pages such as the terminal
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-link]");
      if (t) {
        e.preventDefault();
        go(t);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-link]");
      if (t) {
        e.preventDefault();
        go(t);
      }
    };
    // Old page URLs redirect here with a section hash (e.g. #pricing-section): scroll to it once loaded.
    const initial = location.hash.slice(1);
    const hashTimer = initial && sectionIdByHash[initial]
      ? window.setTimeout(() => {
          const el = document.getElementById(sectionIdByHash[initial]);
          if (el) lenis.scrollTo(el);
        }, 1200)
      : 0;
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hashTimer);
      lenis.destroy();
      io.disconnect();
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return null;
}
