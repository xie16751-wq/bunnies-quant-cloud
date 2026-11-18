/* Bunnies 云端配置：站点与量化终端共用。
 * apiBase：本地 serve.js 通过 Cloudflare 隧道暴露出来的地址。
 *   使用 trycloudflare 临时隧道时，每次重启 cloudflared 地址都会变，需要同步修改这里并重新部署。
 *   改用固定域名的 Cloudflare Tunnel 后只需设置一次。
 * snapshot：网站上展示的模拟账户与审批状态快照（手工更新，来源见 work/paper/reports/）。
 */
window.BUNNIES_CONFIG = {
  apiBase: "https://faced-pipes-deleted-start.trycloudflare.com",
  snapshot: {
    asOf: "2026-11-16",
    initialCapital: 100000,
    equity: 87080.07,
    totalReturn: -0.1292,
    benchmarkReturn: -0.0782,
    excessReturn: -0.0510,
    attribution: { market: -0.0390, fees: -0.0027, residual: -0.0874 },
    trades: { closed: 15, wins: 4, losses: 11, avgHoldingDays: 6.7 },
    approval: { candidates: 13, passed: 0, conditional: 1 }
  }
};
