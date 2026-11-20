"use client";

import { useState } from "react";
import { TERMINAL, useConfig } from "./config";

/** Stock search: opens the terminal's analysis for the code or name typed. */
export function StockSearch() {
  const [q, setQ] = useState("");
  const go = (code: string) => {
    const v = code.trim();
    window.location.href = TERMINAL + (v ? "?q=" + encodeURIComponent(v) : "");
  };
  return (
    <div className="bn-search-wrap">
      <form
        className="bn-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="股票代码或名称，如 600519"
          aria-label="股票代码或名称"
          autoComplete="off"
        />
        <button type="submit">
          开始研判
          <img src="/sites/bunnies/images/arow-white.svg" alt="" />
        </button>
      </form>
      <div className="bn-chips">
        <span>试试：</span>
        {[
          ["600519", "贵州茅台"],
          ["300750", "宁德时代"],
          ["000001", "平安银行"],
        ].map(([code, name]) => (
          <button key={code} type="button" onClick={() => go(code)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Small honest status tags in place of the template's avatar row. */
export function StatusTags() {
  return (
    <div className="bn-tags">
      <span className="on">模拟研究</span>
      <span className="off">未获真实资金审批</span>
      <span>红涨绿跌</span>
    </div>
  );
}

/** A value from /site/config.js, so the page never hard-codes numbers that the terminal also shows. */
export function Snap({ k, fallback }: { k: "approval"; fallback: string }) {
  const cfg = useConfig();
  const a = cfg.snapshot?.approval;
  if (k === "approval" && a) return <>{`${a.passed} / ${a.candidates}`}</>;
  return <>{fallback}</>;
}
