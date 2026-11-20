"use client";

import { useSyncExternalStore } from "react";

/** Shape of window.BUNNIES_CONFIG, defined in /site/config.js (shared with the terminal). */
export interface Snapshot {
  asOf: string;
  initialCapital: number;
  equity: number;
  totalReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  attribution: { market: number; fees: number; residual: number };
  trades: { closed: number; wins: number; losses: number; avgHoldingDays: number };
  approval: { candidates: number; passed: number; conditional: number };
}
export interface BunniesConfig {
  apiBase?: string;
  snapshot: Snapshot;
}

declare global {
  interface Window {
    BUNNIES_CONFIG?: BunniesConfig;
  }
}

/** Used only if /site/config.js fails to load. Same values as the shipped config. */
export const FALLBACK: BunniesConfig = {
  snapshot: {
    asOf: "2026-11-16",
    initialCapital: 100000,
    equity: 87080.07,
    totalReturn: -0.1292,
    benchmarkReturn: -0.0782,
    excessReturn: -0.051,
    attribution: { market: -0.039, fees: -0.0027, residual: -0.0874 },
    trades: { closed: 15, wins: 4, losses: 11, avgHoldingDays: 6.7 },
    approval: { candidates: 13, passed: 0, conditional: 1 },
  },
};

const noop = () => () => {};
export function useConfig(): BunniesConfig {
  return useSyncExternalStore(noop, () => window.BUNNIES_CONFIG ?? FALLBACK, () => FALLBACK);
}

export const TERMINAL = "ashare-quant.html";
export const pct = (v: number, signed = true) => (signed && v > 0 ? "+" : "") + (v * 100).toFixed(2) + "%";
export const money = (v: number) => v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
