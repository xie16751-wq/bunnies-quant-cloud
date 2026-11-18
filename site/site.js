/* Bunnies 量研 · 站点脚本 v2 */
(function () {
  'use strict';

  var TERMINAL = 'ashare-quant.html';
  var NAV = [
    { href: 'index.html', key: 'home', label: '首页' },
    { href: 'strategies.html', key: 'strategies', label: '策略' },
    { href: 'method.html', key: 'method', label: '方法与治理' },
    { href: 'start.html', key: 'start', label: '终端入口' }
  ];
  var page = document.body.dataset.page || 'home';
  var cfg = window.BUNNIES_CONFIG || {};

  function navLink(p) {
    return '<a href="' + p.href + '"' + (p.key === page ? ' aria-current="page"' : '') + '>' + p.label + '</a>';
  }

  var header = document.getElementById('siteHeader');
  if (header) {
    header.outerHTML =
      '<a class="skip" href="#main">跳到正文</a>' +
      '<header class="site-header"><div class="wrap site-nav">' +
        '<a class="brand" href="index.html" aria-label="Bunnies 量研首页"><img src="site/logo.png" alt=""><span>Bunnies <small>量研</small></span></a>' +
        '<nav class="nav-links" aria-label="主导航">' + NAV.map(navLink).join('') + '</nav>' +
        '<a class="btn btn-primary btn-sm nav-cta" href="' + TERMINAL + '">打开终端 ↗</a>' +
        '<button class="menu-btn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="mobileMenu"><span></span></button>' +
      '</div></header>' +
      '<nav class="mobile-menu" id="mobileMenu" aria-label="移动端导航">' +
        NAV.map(function (p) { return navLink(p).replace('</a>', '<span aria-hidden="true">→</span></a>'); }).join('') +
        '<a class="btn btn-primary" href="' + TERMINAL + '">打开量化终端 ↗</a>' +
      '</nav>';
  }

  var footer = document.getElementById('siteFooter');
  if (footer) {
    footer.outerHTML =
      '<footer class="site-footer"><div class="wrap">' +
        '<div class="footer-grid">' +
          '<div class="about"><a class="brand" href="index.html"><img src="site/logo.png" alt=""><span>Bunnies <small>量研</small></span></a>' +
          '<p>面向 A 股的个人量化研究台：数据、因子、模型与风控在同一条可审计的流程里运行。</p></div>' +
          '<div><h4>网站</h4><ul>' + NAV.map(function (p) { return '<li><a href="' + p.href + '">' + p.label + '</a></li>'; }).join('') + '</ul></div>' +
          '<div><h4>量化终端</h4><ul>' +
            '<li><a href="' + TERMINAL + '">驾驶舱</a></li>' +
            '<li><a href="' + TERMINAL + '?kline=1">K 线行情</a></li>' +
            '<li><a href="' + TERMINAL + '?orchestrator=1">技能编排</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="disclaimer"><span>仅供研究交流，不构成投资建议。系统不连接券商，不执行真实交易。</span><span>© ' + new Date().getFullYear() + ' Bunnies Quant Research</span></div>' +
      '</div></footer>';
  }

  /* 移动端菜单 */
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    if (!btn || !menu) return;
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  }
  if (btn) btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', function () { if (innerWidth > 760) setMenu(false); });

  /* 股票搜索：所有 .js-launch 表单与 [data-q] 快捷按钮都跳转到终端 */
  function launch(q) {
    q = (q || '').trim();
    location.href = TERMINAL + (q ? '?q=' + encodeURIComponent(q) : '');
  }
  document.querySelectorAll('form.js-launch').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      if (input && !input.value.trim()) { input.focus(); return; }
      launch(input ? input.value : '');
    });
  });
  document.querySelectorAll('[data-q]').forEach(function (el) {
    el.addEventListener('click', function () { launch(el.dataset.q); });
  });

  /* 快照数字：data-snap="equity" 等，从 config.js 读取，避免各页手写不一致 */
  var snap = cfg.snapshot;
  if (snap) {
    var pct = function (v, signed) {
      var s = (v * 100).toFixed(2) + '%';
      return signed && v > 0 ? '+' + s : s;
    };
    var pp = function (v) { return (v > 0 ? '+' : '') + (v * 100).toFixed(2) + ' pp'; };
    var values = {
      asOf: snap.asOf,
      equity: snap.equity.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      initial: snap.initialCapital.toLocaleString('zh-CN'),
      total: pct(snap.totalReturn, true),
      bench: pct(snap.benchmarkReturn, true),
      excess: pct(snap.excessReturn, true),
      market: pp(snap.attribution.market),
      fees: pp(snap.attribution.fees),
      residual: pp(snap.attribution.residual),
      totalpp: pp(snap.totalReturn),
      winrate: snap.trades.wins + ' / ' + snap.trades.closed,
      hold: snap.trades.avgHoldingDays + ' 天',
      approval: snap.approval.passed + ' / ' + snap.approval.candidates
    };
    var signOf = { total: snap.totalReturn, bench: snap.benchmarkReturn, excess: snap.excessReturn,
      market: snap.attribution.market, fees: snap.attribution.fees, residual: snap.attribution.residual, totalpp: snap.totalReturn };
    document.querySelectorAll('[data-snap]').forEach(function (el) {
      var k = el.dataset.snap;
      if (!(k in values)) return;
      el.textContent = values[k];
      if (k in signOf) el.classList.add(signOf[k] >= 0 ? 'up' : 'down');
    });
    /* 归因条宽度：按绝对值占总亏损比例 */
    var scale = Math.abs(snap.totalReturn) || 1;
    document.querySelectorAll('[data-bar]').forEach(function (el) {
      var v = el.dataset.bar === 'total' ? snap.totalReturn : snap.attribution[el.dataset.bar];
      el.style.width = Math.min(100, Math.abs(v) / scale * 100).toFixed(1) + '%';
    });
  }

  /* 数据服务连通性检查（终端入口页） */
  document.querySelectorAll('[data-api-status]').forEach(function (el) {
    var dot = el.querySelector('.dot');
    var text = el.querySelector('[data-api-text]');
    if (!cfg.apiBase) { text.textContent = '未配置数据服务地址'; dot.classList.add('bad'); return; }
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);
    fetch(cfg.apiBase + '/api/ping', { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
      .then(function () {
        dot.classList.add('ok');
        text.textContent = '实时数据服务在线，终端可以读取行情与模拟账户。';
      })
      .catch(function () {
        dot.classList.add('bad');
        text.textContent = '实时数据服务当前离线：终端页面可以打开，但行情、账户与技能状态无法加载。需要在本机启动 serve.js 与 Cloudflare 隧道。';
      })
      .then(function () { clearTimeout(timer); });
  });

  /* 轻量淡入 */
  /* 用位置判断而不是 IntersectionObserver：跳转锚点或快速滚动越过的区块也会显示，不会留下空白 */
  var pending = [].slice.call(document.querySelectorAll('.reveal'));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    pending.forEach(function (el) { el.classList.add('in'); });
    pending = [];
  }
  var ticking = false;
  function reveal() {
    ticking = false;
    var limit = innerHeight * 0.92;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false; }
      return true;
    });
    if (!pending.length) removeEventListener('scroll', onScroll);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(reveal); } }
  if (pending.length) { addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); reveal(); }
})();
