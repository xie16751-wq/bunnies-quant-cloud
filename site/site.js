const navPages = [
  { href: 'index.html', key: 'home', label: '首页', desc: '研究理念、策略与工作流' },
  { href: 'strategies.html', key: 'strategies', label: '策略', desc: '质量、因子、神经网络与资本保全' },
  { href: 'method.html', key: 'method', label: '方法', desc: '从数据接入到风险审批' },
  { href: 'desk.html', key: 'desk', label: '研究台', desc: '数据、模型与风险协作方式' },
  { href: 'start.html', key: 'start', label: '开始研究', desc: '输入股票代码进入量化终端' }
];
const terminalHref = 'ashare-quant.html';
const menuPages = navPages.concat([
  { href: terminalHref, key: 'terminal', label: '量化终端', desc: '驾驶舱、个股研判、回测与模拟交易' },
  { href: terminalHref + '?kline=1', key: 'kline', label: 'K线行情', desc: '分时、五日、日K、周K与月K' }
]);
const page = document.body.dataset.page || 'home';

function headerHTML() {
  const links = navPages.map(p => `<a href="${p.href}"${page === p.key ? ' class="active" aria-current="page"' : ''}>${p.label}</a>`).join('');
  const menuLinks = menuPages.map((p, i) => `<a href="${p.href}"${page === p.key ? ' aria-current="page"' : ''}><span class="site-menu-index">${String(i + 1).padStart(2, '0')}</span><span class="site-menu-copy"><b>${p.label}</b><small>${p.desc}</small></span><span class="site-menu-arrow">↗</span></a>`).join('');
  return `<div class="site-nav-wrap"><nav class="site-nav" aria-label="主导航"><a class="site-brand" href="index.html" aria-label="Bunnies 首页"><img src="site/logo.png" alt=""><span>BUNNIES</span></a><div class="nav-links">${links}</div><div class="site-nav-actions"><a class="site-nav-cta" href="${terminalHref}" aria-label="进入量化终端"><span class="cta-long">进入终端</span><span class="cta-short">终端 ↗</span></a><button class="menu-toggle" id="menuToggle" type="button" aria-controls="siteMenu" aria-expanded="false">Menu</button></div></nav></div><div class="scroll-line" id="scrollLine"></div><div class="site-menu" id="siteMenu" role="dialog" aria-modal="true" inert aria-label="站点菜单" aria-hidden="true"><div class="site-menu-in"><div class="site-menu-head"><b>BUNNIES / MENU</b><button class="site-menu-close" id="menuClose" type="button">Close</button></div><div class="site-menu-links">${menuLinks}</div><div class="site-menu-foot">INDEPENDENT QUANT RESEARCH · CHINA A-SHARES<br>10 万模拟研究账户 · 未经审批不执行真实交易</div></div></div>`;
}

function footerHTML() {
  return `<footer class="footer"><div class="wrap"><div class="footer-top"><div class="footer-main">从信号到决策，从决策到复盘。<small>Independent quantitative research · China A-shares</small></div><div><div class="footer-label">PAGES</div><div class="footer-links">${navPages.map(p => `<a href="${p.href}">${p.label}</a>`).join('')}</div></div><div><div class="footer-label">SYSTEM</div><div class="footer-links"><a href="${terminalHref}">量化终端</a><a href="${terminalHref}?kline=1">K线行情</a><a href="${terminalHref}?orchestrator=delivery">技能编排</a><a href="${terminalHref}?motion=delivery">实时驾驶舱</a></div></div><div><div class="footer-label">OFFICE</div><div class="footer-links"><span class="clock" data-clock></span><span>Shanghai / Shenzhen</span><span>Research only. No real orders.</span></div></div></div><div class="footer-wordmark">BUNNIES</div><div class="footer-bottom"><span>© <span data-year></span> Bunnies Quant Research. All rights reserved.</span><span>Independent · Auditable · Paper-first</span></div></div></footer>`;
}

const header = document.getElementById('siteHeader');
const footer = document.getElementById('siteFooter');
if (header) header.innerHTML = headerHTML();
if (footer) footer.innerHTML = footerHTML();

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const menu = document.getElementById('siteMenu');
const toggle = document.getElementById('menuToggle');
const close = document.getElementById('menuClose');
let menuReturnFocus = null;

function setMenu(open, restoreFocus = true) {
  if (!menu || !toggle) return;
  menu.classList.toggle('open', open); if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
  menu.setAttribute('aria-hidden', String(!open));
  toggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    menuReturnFocus = document.activeElement;
    setTimeout(() => menu.querySelector('.site-menu-links a')?.focus(), 60);
  } else if (restoreFocus && menuReturnFocus instanceof HTMLElement) {
    menuReturnFocus.focus();
  }
}
if (toggle) toggle.addEventListener('click', () => setMenu(true));
if (close) close.addEventListener('click', () => setMenu(false));
if (menu) menu.addEventListener('click', event => { if (event.target === menu) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.classList.contains('open')) { setMenu(false); return; }
  if (event.key !== 'Tab' || !menu?.classList.contains('open')) return;
  const focusable = [...menu.querySelectorAll('a,button')].filter(el => !el.disabled);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

const line = document.getElementById('scrollLine');
const nav = document.querySelector('.site-nav');
const backTop = document.createElement('button');
backTop.className = 'back-to-top';
backTop.type = 'button';
backTop.setAttribute('aria-label', '回到顶部');
backTop.textContent = '↑';
document.body.appendChild(backTop);
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
function updateScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const progress = max > 0 ? Math.min(1, scrollY / max) : 0;
  if (line) line.style.transform = `scaleX(${progress})`;
  if (nav) nav.classList.toggle('is-scrolled', scrollY > 20);
  backTop.classList.toggle('show', scrollY > 620);
}
addEventListener('scroll', updateScroll, { passive: true });
updateScroll();

const revealItems = [...document.querySelectorAll('.reveal'), ...document.querySelectorAll('section,.section,.cta-section')];
const uniqueRevealItems = [...new Set(revealItems)];
if (reduceMotion || !('IntersectionObserver' in window)) {
  uniqueRevealItems.forEach(el => el.classList.add('in'));
} else {
  const revealIO = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); revealIO.unobserve(entry.target); }
  }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  uniqueRevealItems.forEach((el, i) => { el.style.transitionDelay = (i % 5) * 55 + 'ms'; revealIO.observe(el); });
}

function countUp(el) {
  const target = Number(el.dataset.count || el.textContent.replace(/[^0-9.]/g, ''));
  if (!isFinite(target)) return;
  if (reduceMotion) { el.textContent = target.toLocaleString('en-US'); return; }
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / 1200);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const countNodes = [...document.querySelectorAll('[data-count]')];
if (reduceMotion || !('IntersectionObserver' in window)) countNodes.forEach(countUp);
else {
  const countIO = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { countUp(entry.target); countIO.unobserve(entry.target); }
  }), { threshold: 0.4 });
  countNodes.forEach(el => countIO.observe(el));
}

function updateClock() {
  const value = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()) + ' CST';
  document.querySelectorAll('[data-clock]').forEach(el => el.textContent = value);
}
updateClock();
setInterval(updateClock, 1000);
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

const faqItems = [...document.querySelectorAll('.faq-item')];
faqItems.forEach((item, index) => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  if (!q || !a) return;
  if (!a.id) a.id = 'faq-answer-' + index;
  q.setAttribute('aria-controls', a.id);
  q.setAttribute('aria-expanded', 'false');
});
function setFaq(item, open) {
  faqItems.forEach(other => {
    const q = other.querySelector('.faq-q'), a = other.querySelector('.faq-a');
    const isOpen = other === item && open;
    other.classList.toggle('open', isOpen);
    if (q) q.setAttribute('aria-expanded', String(isOpen));
    if (a) a.style.maxHeight = isOpen ? a.scrollHeight + 'px' : '0px';
  });
}
faqItems.forEach(item => {
  const q = item.querySelector('.faq-q');
  if (!q) return;
  q.addEventListener('click', () => setFaq(item, !item.classList.contains('open')));
});
addEventListener('resize', () => faqItems.filter(item => item.classList.contains('open')).forEach(item => {
  const a = item.querySelector('.faq-a'); if (a) a.style.maxHeight = a.scrollHeight + 'px';
}));

const strategyRows = [...document.querySelectorAll('.strategy-row')];
const strategyPreviews = [...document.querySelectorAll('.strategy-preview')];
function activateStrategy(id) {
  strategyRows.forEach(row => {
    const on = row.dataset.preview === id;
    row.classList.toggle('active', on);
    row.setAttribute('aria-selected', String(on));
  });
  strategyPreviews.forEach(preview => preview.classList.toggle('active', preview.dataset.preview === id));
}
strategyRows.forEach(row => {
  row.setAttribute('role', 'button');
  row.setAttribute('tabindex', '0');
  row.setAttribute('aria-selected', 'false');
  row.addEventListener('mouseenter', () => activateStrategy(row.dataset.preview));
  row.addEventListener('focus', () => activateStrategy(row.dataset.preview));
  row.addEventListener('click', () => activateStrategy(row.dataset.preview));
  row.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateStrategy(row.dataset.preview); }
  });
});
if (strategyRows[0]) activateStrategy(strategyRows[0].dataset.preview);

const form = document.getElementById('launchForm');
if (form) form.addEventListener('submit', event => {
  event.preventDefault();
  const input = document.getElementById('launchQuery');
  const q = input ? input.value.trim() : '';
  location.href = terminalHref + (q ? '?q=' + encodeURIComponent(q) : '');
});