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
        '<span class="mkt-clock" title="北京时间；按工作日判断，未计入法定节假日"><span class="dot"></span><b>沪市 --:--:--</b></span>' +
        '<a class="btn btn-primary btn-sm nav-cta" href="' + TERMINAL + '">打开终端 ↗</a>' +
        '<button class="menu-btn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="mobileMenu"><span></span></button>' +
      '</div><i class="fx-progress" aria-hidden="true"></i></header>' +
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
  var counts = {};
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
    /* 可滚动计数的数字：[起点, 终点, 格式]。净值从初始资金滚到当前值，收益率从 0 滚到当前值 */
    var money = function (v) { return Math.round(v).toLocaleString('zh-CN'); };
    counts = {
      equity: [snap.initialCapital, snap.equity, money],
      total: [0, snap.totalReturn, function (v) { return pct(v, true); }],
      bench: [0, snap.benchmarkReturn, function (v) { return pct(v, true); }],
      excess: [0, snap.excessReturn, function (v) { return pct(v, true); }],
      market: [0, snap.attribution.market, pp],
      fees: [0, snap.attribution.fees, pp],
      residual: [0, snap.attribution.residual, pp],
      totalpp: [0, snap.totalReturn, pp]
    };
    document.querySelectorAll('[data-snap]').forEach(function (el) {
      var k = el.dataset.snap;
      if (!(k in values)) return;
      el.textContent = values[k];
      if (k in signOf) el.classList.add(signOf[k] >= 0 ? 'up' : 'down');
      if (k in counts) el.setAttribute('data-count', k);
    });
    /* 归因条宽度：按绝对值占总亏损比例 */
    var scale = Math.abs(snap.totalReturn) || 1;
    document.querySelectorAll('[data-bar]').forEach(function (el) {
      var v = el.dataset.bar === 'total' ? snap.totalReturn : snap.attribution[el.dataset.bar];
      el.setAttribute('data-w', Math.min(100, Math.abs(v) / scale * 100).toFixed(1) + '%');
      el.style.width = el.getAttribute('data-w');
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

  /* ================= 交互层 ================= */
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function each(sel, fn) { [].forEach.call(document.querySelectorAll(sel), fn); }

  /* 沪市时钟：北京时间 + 交易时段（工作日 9:30–11:30、13:00–15:00，不含节假日） */
  var clock = document.querySelector('.mkt-clock');
  if (clock && window.Intl) {
    var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var label = clock.querySelector('b');
    var tick = function () {
      var p = {};
      fmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var m = (+p.hour % 24) * 60 + +p.minute;
      var workday = ['Sat', 'Sun'].indexOf(p.weekday) < 0;
      var state = !workday ? '休市' : (m >= 570 && m < 690) || (m >= 780 && m < 900) ? '交易中' : (m >= 690 && m < 780) ? '午间休市' : '休市';
      clock.classList.toggle('open', state === '交易中');
      label.textContent = '沪市 ' + (+p.hour % 24 < 10 ? '0' : '') + (+p.hour % 24) + ':' + p.minute + ':' + p.second + ' · ' + state;
    };
    tick(); setInterval(tick, 1000);
  }

  /* 箭头字符包一层，悬停时沿方向轻推 */
  each('.btn, .more, .card .go, .panel-foot a', function (el) {
    [].forEach.call(el.childNodes, function (n) {
      if (n.nodeType !== 3 || !/[→↗↓]/.test(n.nodeValue)) return;
      var span = document.createElement('span');
      span.innerHTML = n.nodeValue.replace(/([→↗↓])/g, function (a) {
        return '<span class="fx-arrow' + (a === '↗' ? ' ne' : a === '↓' ? ' dn' : '') + '" aria-hidden="true">' + a + '</span>';
      });
      while (span.firstChild) el.insertBefore(span.firstChild, n);
      el.removeChild(n);
    });
  });

  /* 列表子项序号，用于依次进入 */
  each('.grid, .stack, .steps, .chain', function (list) {
    [].forEach.call(list.children, function (c, i) { c.style.setProperty('--i', i); });
  });

  /* 首屏入场：标题按 <br> 拆行上浮，其余元素依次淡入 */
  if (!still) {
    each('.hero, .page-hero', function (hero) {
      var h1 = hero.querySelector('h1');
      if (h1) {
        h1.innerHTML = h1.innerHTML.split(/<br\s*\/?>/i).map(function (line, i) {
          return '<span class="fx-ln"><span style="--d:' + (120 + i * 120) + 'ms">' + line.trim() + '</span></span>';
        }).join('');
      }
      var order = ['.kicker', '.lead', '.toc', '.search', '.chips', '.status-line', '.panel'];
      var delay = { '.kicker': 0, '.lead': 380, '.toc': 480, '.search': 480, '.chips': 580, '.status-line': 660, '.panel': 420 };
      order.forEach(function (sel) {
        var el = hero.querySelector(sel);
        if (el) { el.classList.add('fx-intro'); el.style.setProperty('--d', delay[sel] + 'ms'); }
      });
    });
    /* 英文小标签：等宽字符解码效果 */
    each('.kicker .en', function (el) {
      var target = el.textContent, glyphs = '01<>/+#*=_', start = performance.now(), dur = 900;
      (function run(t) {
        var k = Math.min(1, (t - start) / dur), n = Math.floor(k * target.length);
        el.textContent = target.slice(0, n) + target.slice(n).replace(/[^\s&]/g, function () { return glyphs[Math.random() * glyphs.length | 0]; });
        if (k < 1) requestAnimationFrame(run); else el.textContent = target;
      })(start);
    });
  }

  /* 首屏星点场：缓慢漂移，近邻连线；鼠标附近连成星座 */
  function starField(host) {
    var c = document.createElement('canvas');
    c.className = 'fx-field'; c.setAttribute('aria-hidden', 'true');
    host.insertBefore(c, host.firstChild);
    var ctx = c.getContext('2d'), W = 0, H = 0, pts = [], mx = -1e4, my = -1e4, live = true, raf = 0, t0 = performance.now();
    function size() {
      var r = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(innerWidth < 760 ? 40 : 95, Math.round(W * H / 14000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .14, vy: (Math.random() - .5) * .1, r: Math.random() * 1.1 + .45, ph: Math.random() * 6.28 });
    }
    function draw(now) {
      var t = (now - t0) / 1000, i, j, a, b, dx, dy, d;
      ctx.clearRect(0, 0, W, H);
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        if (!still) { a.x += a.vx; a.y += a.vy; if (a.x < -10) a.x = W + 10; if (a.x > W + 10) a.x = -10; if (a.y < -10) a.y = H + 10; if (a.y > H + 10) a.y = -10; }
      }
      ctx.lineWidth = 1;
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        for (j = i + 1; j < pts.length; j++) {
          b = pts[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
          if (d < 12100) { ctx.strokeStyle = 'rgba(143,194,186,' + ((1 - Math.sqrt(d) / 110) * .13).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        dx = a.x - mx; dy = a.y - my; d = Math.sqrt(dx * dx + dy * dy);
        var near = d < 170 ? 1 - d / 170 : 0;
        if (near) { ctx.strokeStyle = 'rgba(143,194,186,' + (near * .42).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke(); }
        var tw = .45 + .35 * Math.sin(t * 1.3 + a.ph) + near * .5;
        ctx.fillStyle = 'rgba(214,236,232,' + Math.min(1, tw).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + near * 1.2, 0, 6.283); ctx.fill();
      }
      if (live && !still) raf = requestAnimationFrame(draw);
    }
    function start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
    size(); start();
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); start(); }, 150); });
    if (finePointer && !still) {
      host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      host.addEventListener('pointerleave', function () { mx = my = -1e4; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { live = es[0].isIntersecting && !document.hidden; if (live) start(); }).observe(host);
    }
    document.addEventListener('visibilitychange', function () { live = !document.hidden; if (live) start(); });
  }
  if (!still) each('.hero, .page-hero', starField);

  /* 悬停聚光：背景光斑跟随鼠标，边框局部点亮 */
  if (finePointer) {
    each('.card, .panel, .cta', function (el) { el.classList.add('fx-spot', 'fx-ring'); });
    each('.steps li', function (el) { el.classList.add('fx-spot'); });
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.fx-spot');
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* 数字滚动 */
  function countUp(el) {
    var spec = counts[el.getAttribute('data-count')];
    if (!spec) return;
    var t0 = performance.now(), dur = 1400;
    (function run(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = spec[2](spec[0] + (spec[1] - spec[0]) * e);
      if (k < 1) requestAnimationFrame(run);
    })(t0);
  }

  /* 进入视口时触发：用位置判断而不是 IntersectionObserver，跳转锚点或快速滚过的区块也会触发 */
  var watchers = [];
  function watch(sel, ratio, fn) { each(sel, function (el) { watchers.push({ el: el, r: ratio, fn: fn }); }); }
  watch('.reveal', .92, function (el) { el.classList.add('in'); });
  if (!still) {
    watch('.section', .8, function (el) { el.classList.add('lit'); });
    watch('[data-count]', .95, countUp);
    each('[data-bar]', function (el) { el.style.width = '0%'; });
    watch('[data-bar]', .92, function (el) { el.style.width = el.getAttribute('data-w'); });
  }
  var progress = document.querySelector('.fx-progress');
  var ticking = false;
  function onFrame() {
    ticking = false;
    var h = innerHeight;
    if (watchers.length) {
      watchers = watchers.filter(function (w) {
        if (w.el.getBoundingClientRect().top < h * w.r) { w.fn(w.el); return false; }
        return true;
      });
    }
    if (progress && !still) {
      var max = document.documentElement.scrollHeight - h;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0).toFixed(4) + ')';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  /* 等一帧，让归因条的 0% 宽度先生效，再触发首屏内的动画 */
  requestAnimationFrame(function () { requestAnimationFrame(onFrame); });
  if (still) onFrame();
})();
