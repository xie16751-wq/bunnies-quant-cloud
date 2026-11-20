"use client";

import { useEffect, useState } from "react";
import { TERMINAL, money, pct, useConfig } from "./config";

interface Daily {
  date: string;
  equity: number;
  benchRet?: number;
  regime?: { on?: boolean; trendOn?: boolean; enabled?: boolean };
}
interface PaperAll {
  account?: {
    initialCapital: number;
    positions: Record<string, { name?: string; qty?: number; shares?: number; cost?: number; last?: number }>;
    stats?: { trades: number; wins: number; losses: number; fees: number };
    lastDate?: string;
  };
  daily?: Daily[];
  healthNow?: { hit: number; ok: boolean; reason?: string } | null;
  riskNow?: { drawdown: number; exposureCap: number } | null;
  modelApproval?: { approved: boolean; passedCandidates: number; candidateCount: number; reason?: string } | null;
}

type State = { status: "loading" } | { status: "live"; data: PaperAll } | { status: "offline" };

const NAV: [string, string][] = [
  ["驾驶舱", TERMINAL],
  ["个股研判", TERMINAL + "#analysis"],
  ["策略研究", TERMINAL + "#research"],
  ["K 线行情", TERMINAL + "?kline=1"],
  ["技能编排", TERMINAL + "?orchestrator=1"],
];

function Curve({ daily, initial }: { daily: Daily[]; initial: number }) {
  const W = 760;
  const H = 210;
  const eq = daily.map((d) => d.equity);
  const bench = daily.map((d) => initial * (1 + (d.benchRet ?? 0)));
  const all = [...eq, ...bench, initial];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const x = (i: number) => (i / Math.max(1, daily.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / Math.max(1, hi - lo)) * (H - 16) - 8;
  const line = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = line(eq) + ` L${W},${H} L0,${H} Z`;
  return (
    <svg className="bn-curve" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="模拟账户净值与沪深 300 对比">
      <defs>
        <linearGradient id="bnArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a5edee" stopOpacity=".28" />
          <stop offset="1" stopColor="#a5edee" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={y(initial)} y2={y(initial)} className="base" />
      <path d={area} fill="url(#bnArea)" />
      <path d={line(bench)} className="bench" />
      <path d={line(eq)} className="eq" />
    </svg>
  );
}

function Gate({ name, ok, note }: { name: string; ok: boolean | null; note: string }) {
  return (
    <li>
      <i className={ok === null ? "na" : ok ? "ok" : "bad"} />
      <div>
        <b>{name}</b>
        <span>{note}</span>
      </div>
    </li>
  );
}

export function LivePanel() {
  const cfg = useConfig();
  const snap = cfg.snapshot;
  const [fetched, setState] = useState<State>({ status: "loading" });
  const state: State = cfg.apiBase ? fetched : { status: "offline" };

  useEffect(() => {
    const base = cfg.apiBase;
    if (!base) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 8000);
    fetch(base + "/api/paper/all", { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: PaperAll) => setState(data && data.daily ? { status: "live", data } : { status: "offline" }))
      .catch(() => setState({ status: "offline" }))
      .finally(() => window.clearTimeout(timer));
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [cfg.apiBase]);

  const live = state.status === "live" ? state.data : null;
  const daily = live?.daily ?? [];
  const last = daily[daily.length - 1];
  const initial = live?.account?.initialCapital ?? snap.initialCapital;
  const equity = last?.equity ?? snap.equity;
  const total = equity / initial - 1;
  const bench = last?.benchRet ?? snap.benchmarkReturn;
  const excess = total - bench;
  const asOf = last?.date ?? snap.asOf;
  const positions = live ? Object.entries(live.account?.positions ?? {}) : [];
  const stats = live?.account?.stats;
  const approval = live?.modelApproval;
  const regime = last?.regime;

  return (
    <div className="bn-panel">
      <aside className="bn-side">
        <div className="bn-side-title">
          <small>量化终端</small>
          <b>Bunnies 量研</b>
        </div>
        <nav>
          {NAV.map(([label, href], i) => (
            <a key={label} href={href} className={i === 0 ? "on" : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <p className="bn-side-note">只读展示 · 不连接券商</p>
      </aside>

      <section className="bn-main">
        <header className="bn-head">
          <div>
            <small>模拟账户 · 10 万元起始</small>
            <h3>账户总览</h3>
          </div>
          <span className={`bn-live ${state.status}`}>
            {state.status === "live" ? `实时 · ${asOf}` : state.status === "loading" ? "正在连接数据服务…" : `数据服务离线 · 快照 ${asOf}`}
          </span>
        </header>

        <div className="bn-grid">
          <div className="bn-card bn-balance">
            <small>账户净值（元）</small>
            <div className="bn-equity">
              <b>{money(equity)}</b>
              <em className={total >= 0 ? "up" : "down"}>{pct(total)}</em>
            </div>
            <div className="bn-legend">
              <span className="eq">模拟账户</span>
              <span className="bench">沪深 300（同期）{pct(bench)}</span>
              <span>超额 <em className={excess >= 0 ? "up" : "down"}>{pct(excess)}</em></span>
            </div>
            {daily.length > 1 ? (
              <Curve daily={daily} initial={initial} />
            ) : (
              <div className="bn-attr">
                <p>收益归因（快照，百分点）</p>
                {(
                  [
                    ["市场 β", snap.attribution.market],
                    ["交易费用", snap.attribution.fees],
                    ["选股 / 择时残差", snap.attribution.residual],
                  ] as [string, number][]
                ).map(([k, v]) => (
                  <div key={k} className="row">
                    <span>{k}</span>
                    <i style={{ width: `${Math.min(100, (Math.abs(v) / Math.abs(snap.totalReturn || 1)) * 100)}%` }} />
                    <em className="down">{(v * 100).toFixed(2)}</em>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bn-card bn-gates">
            <small>风控闸门</small>
            <ul>
              <Gate
                name="大盘闸门（MA20）"
                ok={regime ? Boolean(regime.on) : null}
                note={regime ? (regime.on ? "沪深 300 在 MA20 上方" : "沪深 300 跌破 MA20，停止新开仓") : "等待数据"}
              />
              <Gate
                name="模型健康度"
                ok={live?.healthNow ? live.healthNow.ok : null}
                note={live?.healthNow ? `滚动命中率 ${(live.healthNow.hit * 100).toFixed(0)}%（阈值 45%）` : "等待数据"}
              />
              <Gate
                name="回撤预算"
                ok={live?.riskNow ? live.riskNow.drawdown > -0.1 : null}
                note={live?.riskNow ? `回撤 ${pct(live.riskNow.drawdown)}，仓位上限 ${(live.riskNow.exposureCap * 100).toFixed(0)}%` : "等待数据"}
              />
              <Gate
                name="真实资金审批"
                ok={approval ? approval.approved : false}
                note={`${approval?.passedCandidates ?? snap.approval.passed} / ${approval?.candidateCount ?? snap.approval.candidates} 候选通过`}
              />
            </ul>
            <a className="bn-cta" href={TERMINAL}>
              打开驾驶舱 →
            </a>
          </div>

          <div className="bn-card bn-pos">
            <small>当前持仓</small>
            {positions.length ? (
              <table>
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>名称</th>
                    <th>数量</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.slice(0, 4).map(([code, p]) => (
                    <tr key={code}>
                      <td>{code}</td>
                      <td>{p.name ?? "—"}</td>
                      <td>{p.qty ?? p.shares ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="bn-empty">{live ? "当前空仓：闸门未全部通过时不建新仓。" : "离线时不显示持仓明细。"}</p>
            )}
          </div>

          <div className="bn-card bn-stats">
            <small>交易统计</small>
            <dl>
              <div>
                <dt>盈利 / 平仓笔数</dt>
                <dd>
                  {stats ? stats.wins : snap.trades.wins} / {stats ? stats.wins + stats.losses : snap.trades.closed}
                </dd>
              </div>
              <div>
                <dt>平均持有</dt>
                <dd>{snap.trades.avgHoldingDays} 天</dd>
              </div>
              <div>
                <dt>累计费用</dt>
                <dd>{stats ? money(stats.fees) + " 元" : pct(snap.attribution.fees)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
