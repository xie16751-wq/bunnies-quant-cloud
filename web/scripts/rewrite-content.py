# One-off: replaces the template's placeholder copy with Bunnies content.
# Each entry: (old, new, expected_count). Run from web/: python scripts/rewrite-content.py
import io, re, sys, pathlib

D = pathlib.Path("src/components/sites/bunnies/sections")
TERM = "ashare-quant.html"
PEACH_LINK = 'data-link="https://peachweb.io/" data-external="" role="link" tabIndex={0}'

def link(href):
    return f'data-link="{href}" role="link" tabIndex={{0}}'

def edit(name, reps, regex=()):
    p = D / f"{name}.tsx"
    s = p.read_text(encoding="utf8")
    for pat, new, n in regex:
        s, c = re.subn(pat, new, s, flags=re.S)
        if c != n:
            sys.exit(f"{name}: regex {pat[:50]!r} matched {c}, expected {n}")
    for old, new, n in reps:
        c = s.count(old)
        if c != n:
            sys.exit(f"{name}: expected {n} of {old[:60]!r}, found {c}")
        s = s.replace(old, new)
    p.write_text(s, encoding="utf8")
    print("ok", name)

# ---------------------------------------------------------------- Header
edit("Header", [
    (f'id="ispyh-2-3-2-3-3-2" {PEACH_LINK}', f'id="ispyh-2-3-2-3-3-2" {link("#anchor-hero")}', 1),
    ("AI Finance\n            </div>", "Bunnies 量研\n            </div>", 1),
    ("                Solutions\n              </p>", "                模拟账户\n              </p>", 1),
    ("                Features\n              </p>", "                量化终端\n              </p>", 1),
    ("                Services\n              </p>", "                研究流程\n              </p>", 1),
    ("                Pricing\n              </p>", "                策略状态\n              </p>", 1),
    (f'id="i1lwz-2-2-2-2-2-2" {PEACH_LINK}', f'id="i1lwz-2-2-2-2-2-2" {link(TERM)}', 1),
    ("                  Get Started\n                </p>", "                  打开终端\n                </p>", 1),
], regex=[
    # Phone-only hamburger and menu overlay: never shown on desktop, removed.
    (r'\n\s*<div className="pwb-flex-grid-wrap" id="i1lwz-2-3-4">.*?\n          </div>\n(?=        </div>\n      </div>\n    </div>\n  \);)', "\n", 1),
])

# ------------------------------------------------------------------ Hero
edit("Hero", [
    ("The future of\n            <br id=\"ibpex9\" />\n            AI Finance.", "让每个决策\n            <br id=\"ibpex9\" />\n            都可验证。", 1),
    ("Banking of Tomorrow.", "Bunnies 量研 · A 股量化研究", 1),
    ("We specialize in leveraging artificial intelligence to transform financial operations and decision-making.",
     "行情、财报、资金流与公告进入同一条研究链：先校验数据，再让因子、模型与价值审查互相复核，最后经过风控闸门和人工审批。", 1),
    (f'id="i1lwz-2-2-2-5" {PEACH_LINK}', f'id="i1lwz-2-2-2-5" {link("#solutions-section")}', 1),
    ("Discover More", "研究流程", 1),
], regex=[
    # Stock search replaces the template's sign-up button.
    (r'<div className="pwb-flex-grid-wrap" id="i1lwz-2-2-2-2-2-2-4".*?\n            </div>\n', '<StockSearch />\n', 1),
    # Avatar row of placeholder people replaced by honest status tags.
    (r'<div className="pw-block-style" id="izwg2d">.*?\n            </div>\n', '<StatusTags />\n', 1),
])
p = D / "Hero.tsx"
s = p.read_text(encoding="utf8")
s = s.replace("/* eslint-disable @next/next/no-img-element */\n", "")
s = s.replace("export function Hero()", 'import { StatusTags, StockSearch } from "../Widgets";\n\nexport function Hero()', 1)
p.write_text(s, encoding="utf8")

# --------------------------------------------------------------- Product
edit("Product", [
    (f'id="ispyh-2-3-2-3-2-2-2-3" {PEACH_LINK}', 'id="ispyh-2-3-2-3-2-2-2-3"', 1),
    ("SOLUTIONS", "模拟账户", 1),
    ("Revolutionize your financial workflows.", "账户真实状态，不挑好看的数字。", 1),
    (f'id="i1lwz-2-2-2-6" {PEACH_LINK}', f'id="i1lwz-2-2-2-6" {link(TERM)}', 1),
    ("Get Started", "打开驾驶舱", 1),
    (f'id="i1lwz-2-2-2-5-2" {PEACH_LINK}', f'id="i1lwz-2-2-2-5-2" {link("#pricing-section")}', 1),
    ("View Demo", "看策略状态", 1),
    ("Our AI solutions automate complex financial processes, reduce manual errors, and enhance strategic insights across your organization.",
     "10 万元模拟账户的净值、相对沪深 300 的表现与风控闸门状态，直接读取研究服务；服务离线时显示最近一次快照。", 1),
    ('<img className="pw-image-style" src="/sites/bunnies/images/dash.png" loading="lazy" id="i0esdr" alt="" />', "<LivePanel />", 1),
])
p = D / "Product.tsx"
s = p.read_text(encoding="utf8").replace("export function Product()", 'import { LivePanel } from "../LivePanel";\n\nexport function Product()', 1)
p.write_text(s, encoding="utf8")

# -------------------------------------------------------------- Partners
SOURCES = ["腾讯行情", "东方财富", "新浪财报", "巨潮公告", "同花顺题材", "券商研报", "龙虎榜", "资金流"]
p = D / "Partners.tsx"
s = p.read_text(encoding="utf8")
imgs = re.findall(r'<img className="pw-image-style" src="[^"]+" loading="lazy" id="[^"]+" alt="" />', s)
if len(imgs) != 8:
    sys.exit(f"Partners: expected 8 logos, found {len(imgs)}")
for img, name in zip(imgs, SOURCES):
    s = s.replace(img, f'<span className="bn-source">{name}</span>', 1)
s = s.replace(f'id="ispyh-2-3-2-3-2-2-2-3-2-2-5" {PEACH_LINK}', 'id="ispyh-2-3-2-3-2-2-2-3-2-2-5"')
s = s.replace("OUR PARTNERS", "数据来源").replace("Trusted by leading financial institutions.", "公开数据，统一口径后才进入模型。")
s = s.replace("/* eslint-disable @next/next/no-img-element */\n", "")
p.write_text(s, encoding="utf8")
print("ok Partners")

# -------------------------------------------------------------- Features
edit("Features", [
    (f'id="ispyh-2-3-2-3-2-2-2-3-2-2" {PEACH_LINK}', 'id="ispyh-2-3-2-3-2-2-2-3-2-2"', 1),
    ("FEATURES", "核心能力", 1),
    ("The future of finance is here.", "三道关口，互相复核。", 1),
    ("We provide cutting-edge AI tools to optimize your financial performance.", "因子、模型与价值审查互相校验，风控和审批对任何看多观点都有否决权。", 1),
    ("Predictive Analytics", "个股研判", 1),
    ('Gain foresight into market trends.{" "}', "量化、AI 投票与价值审查联合给出结论。", 1),
    ("Automated Compliance", "风控闸门", 1),
    ('Ensure regulatory adherence.{" "}', "大盘、健康度与回撤，一项不达标就停止开仓。", 1),
    ("Fraud Detection", "模型审批", 1),
    ('Protect your assets proactively.{" "}', "三个股票池同时通过检验才能进入账户。", 1),
])

# ----------------------------------------------------------- KeyFeatures
ROWS = [
    ("工作区 01", "驾驶舱：账户、风控与今日方案。", "模拟账户净值、仓位、风控闸门状态与当日调仓方案集中在一屏，红涨绿跌。", "打开驾驶舱", TERM),
    ("工作区 02", "K 线行情：分时到月线。", "分时、五日、日 K、周 K 与月 K，叠加均线与成交量，直接读取实时行情。", "打开 K 线", TERM + "?kline=1"),
    ("工作区 03", "技能编排：216 项研究技能。", "每项技能的阶段、职责、冲突组与安全边界，按固定顺序编排，交易类技能只能人工审批。", "打开技能编排", TERM + "?orchestrator=1"),
]
p = D / "KeyFeatures.tsx"
s = p.read_text(encoding="utf8")
s = s.replace(f'{PEACH_LINK}', "PEACH")
s = s.replace("ABOUT OUR SOLUTIONS", "量化终端").replace("Key Features", "终端里的三个工作区")
s = s.replace("Explore the core capabilities that drive financial innovation and efficiency.", "个股研判之外，账户、行情与技能编排都在同一个终端里，搜索一只股票即可开始。")
plan = [("FEATURE 1", "Optimize financial forecasting.", "Our AI models provide accurate predictions, helping you make informed decisions and strategize for future growth.", 0),
        ("FEATURE 2", "Streamline risk management.", "Automate risk assessments and identify potential threats before they impact your financial stability.", 1),
        ("FEATURE 3", "Enhance customer insights.", "Leverage AI to understand customer behavior and personalize financial services effectively.", 2)]
for tag, title, body, i in plan:
    r = ROWS[i]
    s = s.replace(tag, r[0]).replace(title, r[1]).replace(body, r[2])
# Buttons in order: rows 1,1,2,3,3 (the template repeats rows 1 and 3 for alternate layouts).
order = [0, 0, 1, 2, 2]
parts = s.split("Sign Up")
if len(parts) != 6:
    sys.exit(f"KeyFeatures: expected 5 buttons, found {len(parts)-1}")
s = parts[0] + "".join(ROWS[order[k]][3] + parts[k + 1] for k in range(5))
# Heading labels link nowhere; buttons link to the terminal in the same order.
chunks = s.split("PEACH")
out = chunks[0]
btn = 0
for c in chunks[1:]:
    tag = out[out.rfind("<") + 1 :].split()[0]
    if tag in ("h4", "p"):
        out = out[:-1] + c  # labels and headings: drop the template's link
    else:
        out += link(ROWS[order[btn]][4]) + c
        btn += 1
s = out
p.write_text(s, encoding="utf8")
print("ok KeyFeatures", btn, "buttons")

# -------------------------------------------------------------- Services
edit("Services", [
    (f'id="ispyh-2-3-2-3-2-2-2-3-2-2-2" {PEACH_LINK}', 'id="ispyh-2-3-2-3-2-2-2-3-2-2-2"', 1),
    ("SERVICES", "研究流程", 1),
    ("Tailored for every financial need.", "一条研究，四道关口。", 1),
    ("Our AI solutions are designed to cater to diverse financial sectors and business sizes.", "每一步都留下数据来源、判断依据和失效条件；任何一关不通过，后面的步骤都不会发生。", 1),
    ("Banking & Lending", "01 事实", 1),
    ('We provide AI-driven tools to optimize loan processing, credit scoring, and customer service in banking.{" "}', "统一行情、财报、公告的数据口径与时点，剔除缺失、限流和异常值；数据没校验，模型不出结论。", 1),
    ("Investment Firms", "02 证据", 1),
    ('Our AI platforms offer advanced analytics for portfolio management and market trend prediction for investors.{" "}', "新闻、公告、资金流和财务变化相互印证，单一来源不进入结论，新闻至少双源交叉验证。", 1),
    ('We empower financial consultants with AI tools for data analysis, strategy development, and client advisory.{" "}', "因子与神经网络在 80 / 160 / 600 三个股票池做样本外、扣成本、滚动稳定性检验。", 1),
    ("Small to Large Enterprises", "04 审批", 1),
    ('Our scalable AI solutions adapt to the unique financial challenges of businesses of all sizes.{" "}', "大盘趋势、模型健康度、回撤预算与人工审批全部通过，才生成交易提案；系统不连接券商。", 1),
], regex=[
    (r"Financial\s*(<br[^>]*/>)?\s*Consulting", "03 验证", 1),
])

# -------------------------------------------------------------- Benefits
edit("Benefits", [
    (f'id="ispyh-2-3-2-3-2-2-2-3-2-2-4-2" {PEACH_LINK}', 'id="ispyh-2-3-2-3-2-2-2-3-2-2-4-2"', 1),
    ("BENEFITS", "研究规模", 1),
    ("Smart. Secure. Scalable.", "先排除错误，", 1),
    ("Welcome to AI Finance.", "再讨论收益。", 1),
    ("+48%", "216", 1),
    ("Efficiency Boost", "项研究技能，按固定顺序编排", 1),
    ("-21%", "15", 1),
    ("Risk Reduction", "层数据健康检查", 1),
    ("10K%", "3", 1),
    ("Client Satisfaction", "个股票池交叉验证（80 / 160 / 600）", 1),
    ("21%", "<Snap k=\"approval\" fallback=\"0 / 13\" />", 1),
    ("Innovation Growth", "候选模型通过真实资金审批", 1),
])
p = D / "Benefits.tsx"
s = p.read_text(encoding="utf8").replace("/* eslint-disable @next/next/no-img-element */\n", "")
s = s.replace("export function Benefits()", 'import { Snap } from "../Widgets";\n\nexport function Benefits()', 1)
p.write_text(s, encoding="utf8")

# ---------------------------------------------------------- Testimonials
LOG = [
    ("image-1927.png", "审", "Jane Doe", "模型治理", "CFO, Global Bank", "2026-11-09 审批结论",
     "“AI Finance has transformed our operations, bringing unparalleled efficiency and insight to our banking processes.”",
     "“没有正式通过的模型。模拟研究可以继续，真实资金不行。”"),
    ("image-1928.png", "归", "Celine Smith", "收益归因", "CEO, InvestCorp", "2026-11-16 复盘",
     "“We&apos;ve seen significant improvements in our investment strategies and risk management since partnering with AI Finance.”",
     "“亏损主要来自选股与择时残差，不是市场，也不是费用。先修正残差，再讨论收益。”"),
    ("image-1929.png", "论", "Mike Jones", "论点规则", "Analyst, FinConsult", "研究纪律",
     "“Their AI solutions are practical, data-driven, and immediately actionable for our consulting needs.”",
     "“没有失效条件的观点，不算论点。先写什么情况下会失败，再写为什么会涨。”"),
]
p = D / "Testimonials.tsx"
s = p.read_text(encoding="utf8")
s = s.replace(PEACH_LINK + ">", ">")
s = s.replace("TESTIMONIALS", "研究日志").replace("What our clients say.", "复盘时写下的三句话。")
for img, mark, n0, n1, r0, r1, q0, q1 in LOG:
    s, c = re.subn(r'<img className="pw-image-style" src="/sites/bunnies/images/' + re.escape(img) + r'"[^>]*/>', f'<span className="bn-avatar">{mark}</span>', s)
    if c != 1:
        sys.exit("Testimonials avatar " + img)
    for a, b in ((n0, n1), (r0, r1), (q0 + '{" "}', q1)):
        if s.count(a) != 1:
            sys.exit("Testimonials text " + a[:40])
        s = s.replace(a, b)
s = s.replace("/* eslint-disable @next/next/no-img-element */\n", "")
p.write_text(s, encoding="utf8")
print("ok Testimonials")

# --------------------------------------------------------------- Pricing
PLANS = [
    ("Starter", "资本保全 v2", "Perfect for small financial teams exploring AI.", "模拟运行中 · 未获真实资金审批", "$199", "+95.1%", "/mo", " 80 只池回测",
     ["Up to 2 users", "Basic analytics access", "Core AI tools", "Standard support"],
     ["最多 3 只，单票 ≤ 18%，现金 ≥ 30%", "沪深 300 跌破 MA20 停止新开仓", "模型命中率低于 45% 停止开仓", "ATR 止损后同一标的冷却 15 天"],
     "Sign Up", "在终端查看"),
    ("Professional", "质量三因子 + MA60", "Ideal for growing financial institutions.", "仅研究 · 已降级", "$499", "+53.0%", "/mo", " 80 只池全期超额",
     ["Up to 10 users", "Advanced analytics access", "Enhanced AI features", "Priority support"],
     ["流动资产占比、经营现金流率、盈利含金量", "前 10 名等权，沪深 300 MA60 择时", "2024 年三个股票池均为负超额", "滚动稳定性不达标，不进入主账户"],
     "Contact Sales", "查看回测"),
    ("Enterprise", "多因子与神经网络", "Best for large organizations with complex needs.", "研究中 · 未提交审批", "$899", "SNAP", "/mo", " 候选通过",
     ["Unlimited Users", "Comprehensive analytics", "Custom AI solutions", "Dedicated support"],
     ["估值、动量、质量、低波与情绪因子", "Walk-forward 滚动训练，防止未来信息", "概率区间过宽时不给方向", "作为情报层参与综合评分"],
     "Contact Sales", "查看方法"),
]
p = D / "Pricing.tsx"
s = p.read_text(encoding="utf8")
s = s.replace(PEACH_LINK, "PEACH")
s = s.replace("PRICING", "策略状态").replace("Plans for every scale.", "每条策略都写清楚审批状态。")
# The two "Contact Sales" buttons are handled by order below.
for name0, name1, d0, d1, p0, p1, u0, u1, f0, f1, b0, b1 in PLANS:
    for a, b in [(name0 + "\n", name1 + "\n"), (d0, d1)] + list(zip(f0, f1)):
        if s.count(a) != 1:
            sys.exit("Pricing " + a[:40])
        s = s.replace(a, b)
    if s.count(p0) != 1:
        sys.exit("Pricing price " + p0)
    s = s.replace(p0, "<Snap k=\"approval\" fallback=\"0 / 13\" />" if p1 == "SNAP" else p1)
    s = s.replace(u0, u1, 1)
btns = ["在终端查看", "查看回测", "查看方法"]
parts = re.split(r"(Sign Up|Contact Sales)", s)
if len(parts) != 7:
    sys.exit(f"Pricing buttons: {len(parts)}")
s = parts[0] + btns[0] + parts[2] + btns[1] + parts[4] + btns[2] + parts[6]
targets = [TERM, TERM, "#solutions-section"]
chunks = s.split("PEACH")
out = chunks[0]
bi = 0
for c in chunks[1:]:
    if out[out.rfind("<") + 1 :].split()[0] in ("h4", "p"):
        out = out[:-1] + c
    else:
        out += link(targets[bi]) + c
        bi += 1
s = out.replace("export function Pricing()", 'import { Snap } from "../Widgets";\n\nexport function Pricing()', 1)
p.write_text(s, encoding="utf8")
print("ok Pricing", bi, "buttons")

# ---------------------------------------------------------------- Footer
p = D / "Footer.tsx"
s = p.read_text(encoding="utf8")
targets = {"Get Started": ("打开量化终端", TERM), "Learn More": ("研究流程", "#solutions-section"),
           "AI Finance": ("Bunnies 量研", "#anchor-hero"), "Solutions": ("模拟账户", "#product-section"),
           "Features": ("量化终端", "#features-section"), "Services": ("研究流程", "#solutions-section"),
           "Pricing": ("策略状态", "#pricing-section"), "LinkedIn": ("驾驶舱", TERM),
           "Twitter": ("K 线行情", TERM + "?kline=1"), "Facebook": ("技能编排", TERM + "?orchestrator=1")}
for old, (new, href) in targets.items():
    m = re.search(r'(data-link=")([^"]+)("(?: data-external="")?[^>]*>\s*(?:<[^>]+>\s*)*)' + re.escape(old) + r"\b", s)
    if not m:
        sys.exit("Footer link " + old)
    seg = m.group(0).replace(m.group(2), href, 1).replace(' data-external=""', "")
    seg = seg[: len(seg) - len(old)] + new
    s = s[: m.start()] + seg + s[m.end():]
for a, b in [("Grow with AI Finance.", "从一只熟悉的股票开始。"),
             ("Start your journey today.", "终端会给出数据覆盖、因子得分、价值审查、风险红线与待审批提案。"),
             ("contact@ai-finance.com", "仅供研究交流，不构成投资建议。系统不连接券商，不执行真实交易。"),
             ("Menu", "页面"), ("Connect", "终端入口")]:
    if s.count(a) != 1:
        sys.exit("Footer " + a)
    s = s.replace(a, b)
s = re.sub(r'data-link="https://peachweb.io/" data-external="" role="link" tabIndex=\{0\}', "", s)
p.write_text(s, encoding="utf8")
print("ok Footer")
