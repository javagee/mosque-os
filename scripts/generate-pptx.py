"""
Generates docs/Imara-Demo-Workflow.pptx
Each slide pairs a real screenshot with descriptions, callouts, and visual annotations.

Usage: python3 scripts/generate-pptx.py
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from lxml import etree
import os, glob

# ── Brand colours ─────────────────────────────────────────────────────────────
GREEN_DARK  = RGBColor(0x1A, 0x3D, 0x2B)
GREEN_MID   = RGBColor(0x2D, 0x6A, 0x4F)
GOLD        = RGBColor(0xC9, 0xA8, 0x4C)
CREAM       = RGBColor(0xF7, 0xF6, 0xF2)
AMBER       = RGBColor(0xD9, 0x7A, 0x06)
AMBER_LIGHT = RGBColor(0xFF, 0xF8, 0xEC)
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)
GREY_LIGHT  = RGBColor(0xF0, 0xF4, 0xF3)
GREY_TEXT   = RGBColor(0x55, 0x55, 0x55)
RED_SOFT    = RGBColor(0xDC, 0x26, 0x26)
GREEN_SOFT  = RGBColor(0x16, 0xA3, 0x4A)

SHOTS = os.path.join("docs", "screenshots")
OUT_PATH = os.path.join("docs", "Imara-Demo-Workflow.pptx")

# ── Low-level helpers ─────────────────────────────────────────────────────────

def add_rect(slide, l, t, w, h, fill=None, line=None, line_color=None, radius=0):
    shape = slide.shapes.add_shape(1, Inches(l), Inches(t), Inches(w), Inches(h))
    if fill:
        shape.fill.solid(); shape.fill.fore_color.rgb = fill
    else:
        shape.fill.background()
    if line and line_color:
        shape.line.color.rgb = line_color; shape.line.width = Pt(line)
    else:
        shape.line.fill.background()
    return shape

def add_text(slide, text, l, t, w, h,
             size=13, bold=False, color=WHITE, align=PP_ALIGN.LEFT,
             wrap=True, italic=False):
    tx = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tx.word_wrap = wrap
    tf = tx.text_frame; tf.word_wrap = wrap
    p = tf.paragraphs[0]; p.alignment = align
    r = p.add_run(); r.text = text
    r.font.size = Pt(size); r.font.bold = bold
    r.font.color.rgb = color; r.font.name = "Calibri"
    r.font.italic = italic
    return tx

def add_image(slide, path, l, t, w, h):
    if os.path.exists(path):
        return slide.shapes.add_picture(path, Inches(l), Inches(t), Inches(w), Inches(h))
    return None

def top_bar(slide, title, persona=None, step=None):
    """Green top bar with optional step number, title, and persona pill."""
    add_rect(slide, 0, 0, 13.33, 1.05, fill=GREEN_DARK)
    if step:
        add_rect(slide, 0.25, 0.16, 0.72, 0.72, fill=GOLD)
        add_text(slide, str(step), 0.25, 0.15, 0.72, 0.72,
                 size=20, bold=True, color=GREEN_DARK, align=PP_ALIGN.CENTER)
        title_l = 1.15
    else:
        title_l = 0.4
    add_text(slide, title, title_l, 0.2, 10.5, 0.65, size=20, bold=True)
    if persona:
        add_rect(slide, 10.8, 0.22, 2.2, 0.46, fill=GOLD)
        add_text(slide, persona, 10.8, 0.22, 2.2, 0.46,
                 size=11, bold=True, color=GREEN_DARK, align=PP_ALIGN.CENTER)

def callout_box(slide, text, l, t, w, h, bg=GOLD, fg=GREEN_DARK, size=11, bold=True):
    """Coloured annotation box."""
    add_rect(slide, l, t, w, h, fill=bg)
    add_text(slide, text, l + 0.08, t + 0.04, w - 0.16, h - 0.08,
             size=size, bold=bold, color=fg, wrap=True)

def note_bar(slide, text, color=AMBER_LIGHT, border=GOLD, text_color=None):
    """Bottom note bar."""
    add_rect(slide, 0.3, 6.6, 12.73, 0.65, fill=color, line=1, line_color=border)
    add_text(slide, f"💡  {text}", 0.5, 6.65, 12.33, 0.55,
             size=11, color=text_color or RGBColor(0x78, 0x50, 0x00), bold=False)

def step_list(slide, items, l=7.0, t=1.2, w=6.1, gap=0.52):
    """Numbered / bulleted step list on the right panel."""
    add_rect(slide, l - 0.15, t - 0.15, w + 0.3, len(items) * gap + 0.4,
             fill=GREY_LIGHT, line=0.5, line_color=RGBColor(0xD0, 0xD8, 0xD4))
    for i, (icon, text, highlight) in enumerate(items):
        y = t + i * gap
        add_text(slide, icon, l, y, 0.45, 0.44, size=13, color=GREEN_DARK)
        clr = GOLD if highlight else RGBColor(0x22, 0x22, 0x22)
        add_text(slide, text, l + 0.45, y, w - 0.55, 0.44,
                 size=12, bold=highlight, color=clr, wrap=True)

# ── Slide builders ────────────────────────────────────────────────────────────

def slide_title(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(s, 0, 0, 13.33, 7.5, fill=GREEN_DARK)
    # Gold strip
    add_rect(s, 0, 6.8, 13.33, 0.7, fill=GOLD)
    # Logo / brand
    add_text(s, "إِمَارَة  ·  Imara", 1, 1.0, 11, 1.0,
             size=28, bold=True, color=GOLD, align=PP_ALIGN.CENTER)
    add_text(s, "MOSQUE DIGITAL PLATFORM", 1, 2.0, 11, 0.6,
             size=14, bold=True, color=RGBColor(0x7A, 0xB5, 0x95), align=PP_ALIGN.CENTER)
    add_text(s, "End-to-End Demo Presentation", 1, 2.7, 11, 1.0,
             size=36, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(s, "29 October 2026  ·  Hj Suhaimi, Vice Chairman", 1, 3.85, 11, 0.6,
             size=15, color=RGBColor(0xA8, 0xD5, 0xBE), align=PP_ALIGN.CENTER)
    # Personas row
    for i, (icon, label, bg) in enumerate([
        ("👤", "Buyer", GREEN_MID),
        ("🛡", "Admin", GREEN_MID),
        ("🏪", "Merchant", GREEN_MID),
    ]):
        x = 2.8 + i * 2.8
        add_rect(s, x, 4.9, 2.2, 0.9, fill=bg)
        add_text(s, f"{icon}  {label}", x, 4.9, 2.2, 0.9,
                 size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(s, "mosque-os-ai.vercel.app", 1, 6.85, 11, 0.5,
             size=12, color=GREEN_DARK, align=PP_ALIGN.CENTER, bold=True)

def slide_overview(prs):
    """7-step summary slide."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(s, 0, 0, 13.33, 7.5, fill=GREEN_DARK)
    add_rect(s, 0, 0, 0.3, 7.5, fill=GOLD)
    add_text(s, "COMPLETE 7-STEP AUTOMATED FLOW", 0.6, 0.25, 12, 0.5,
             size=12, bold=True, color=GOLD)
    add_text(s, "How Imara works — end to end", 0.6, 0.75, 12, 0.7,
             size=28, bold=True)

    steps = [
        ("👤", "1", "Buyer buys",          "Email to buyer (ack) + email to admin (verify)",       GOLD),
        ("👤", "2", "Buyer tracks",         "/orders auto-refreshes every 30s",                     WHITE),
        ("🛡", "3", "Admin verifies",       "Email to buyer — e-coupon + QR link  ✅",              GOLD),
        ("👤", "4", "Buyer gets coupon",    "/coupons/[token] — QR code on screen",                 WHITE),
        ("🏪", "5", "Merchant redeems",     "Email to admin — redemption notification  ✅  NEW",    GOLD),
        ("🏪", "6", "Merchant history",     "/merchant/history — KPI cards & payout",               WHITE),
        ("🛡", "7", "Admin settles",        "/admin/settlements — Mark Settled per merchant",        GOLD),
    ]
    for i, (persona, num, action, result, color) in enumerate(steps):
        y = 1.6 + i * 0.7
        add_rect(s, 0.6, y, 0.5, 0.5, fill=GOLD)
        add_text(s, num, 0.6, y, 0.5, 0.5,
                 size=15, bold=True, color=GREEN_DARK, align=PP_ALIGN.CENTER)
        add_text(s, persona, 1.25, y + 0.03, 0.4, 0.44, size=14)
        add_text(s, action, 1.7, y + 0.04, 2.8, 0.44,
                 size=13, bold=True, color=color)
        add_text(s, f"→  {result}", 4.55, y + 0.04, 8.4, 0.44,
                 size=12, color=RGBColor(0xA8, 0xD5, 0xBE))


def slide_with_screenshot(prs, step, title, persona, screenshot, callouts, steps_list, note=None, img_l=0.3, img_t=1.12, img_w=6.4, img_h=5.25):
    """Main template: screenshot left, annotated steps right."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(s, 0, 0, 13.33, 7.5, fill=CREAM)
    top_bar(s, title, persona=persona, step=step)

    # Screenshot with border
    add_rect(s, img_l - 0.06, img_t - 0.06, img_w + 0.12, img_h + 0.12,
             fill=None, line=1.5, line_color=GREEN_DARK)
    img_path = os.path.join(SHOTS, screenshot)
    add_image(s, img_path, img_l, img_t, img_w, img_h)

    # Screenshot label
    add_text(s, f"🖥  {screenshot.replace('.png','').replace('-',' ').title()}",
             img_l, img_t + img_h + 0.05, img_w, 0.3,
             size=9, color=GREY_TEXT, italic=True)

    # Callout annotations overlaid on image
    for (cl, ct, cw, ch, text, bg, fg) in callouts:
        callout_box(s, text, img_l + cl, img_t + ct, cw, ch, bg=bg, fg=fg, size=9)

    # Steps panel right
    step_list(s, steps_list, l=6.9, t=1.15, w=6.15, gap=0.54)

    if note:
        note_bar(s, note)
    return s


def slide_section(prs, num, title, emoji, desc):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(s, 0, 0, 13.33, 7.5, fill=GREEN_DARK)
    add_rect(s, 0, 0, 0.3, 7.5, fill=GOLD)
    add_text(s, emoji, 0.8, 1.2, 3, 2.5, size=80)
    add_text(s, f"SECTION {num}", 0.8, 1.2, 12, 0.5,
             size=11, bold=True, color=GOLD)
    add_text(s, title, 0.8, 1.7, 11.8, 1.2,
             size=38, bold=True)
    add_text(s, desc, 0.8, 3.05, 10.5, 1.2,
             size=17, color=RGBColor(0xA8, 0xD5, 0xBE))


def slide_identifiers(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(s, 0, 0, 13.33, 7.5, fill=CREAM)
    top_bar(s, "Key Identifiers — Order Reference  vs  Coupon Token")

    # Left card
    add_rect(s, 0.35, 1.2, 6.0, 5.2, fill=WHITE, line=2, line_color=GREEN_DARK)
    add_rect(s, 0.35, 1.2, 6.0, 0.45, fill=GREEN_DARK)
    add_text(s, "ORDER REFERENCE", 0.45, 1.22, 5.8, 0.4,
             size=11, bold=True, color=GOLD)
    add_text(s, "IMA-Y5MNEA", 0.5, 1.8, 5.7, 0.75,
             size=30, bold=True, color=GREEN_DARK)
    rows = [
        ("Created", "When buyer places order"),
        ("Used by", "Buyer — to track order status"),
        ("Page", "/orders  (Track Order in nav)"),
        ("Also on", "PayNow page as payment reference"),
        ("Example", "IMA-Y5MNEA, IMA-GZSP6W"),
    ]
    for i, (k, v) in enumerate(rows):
        y = 2.7 + i * 0.62
        add_rect(s, 0.4, y, 5.9, 0.55, fill=GREY_LIGHT)
        add_text(s, k, 0.5, y + 0.06, 1.4, 0.42, size=11, color=GREY_TEXT, bold=True)
        add_text(s, v, 1.95, y + 0.06, 4.2, 0.42, size=11, color=GREEN_DARK)
    callout_box(s, "Buyer uses this\nfor tracking", 0.42, 5.9, 2.5, 0.42,
                bg=GREEN_DARK, fg=WHITE, size=10)

    # Right card
    add_rect(s, 7.0, 1.2, 6.0, 5.2, fill=WHITE, line=2, line_color=GOLD)
    add_rect(s, 7.0, 1.2, 6.0, 0.45, fill=GOLD)
    add_text(s, "COUPON TOKEN", 7.1, 1.22, 5.8, 0.4,
             size=11, bold=True, color=GREEN_DARK)
    add_text(s, "ABCD-EFG2-HJK3", 7.1, 1.8, 5.7, 0.75,
             size=26, bold=True, color=GREEN_DARK)
    rows2 = [
        ("Created", "When admin verifies payment"),
        ("Used by", "Merchant — to redeem voucher"),
        ("Page", "/merchant/redeem  (Redeem page)"),
        ("Also on", "/coupons/[token]  — QR code"),
        ("Example", "ABCD-EFG2-HJK3, WXYZ-1234-PQRS"),
    ]
    for i, (k, v) in enumerate(rows2):
        y = 2.7 + i * 0.62
        add_rect(s, 7.05, y, 5.9, 0.55, fill=GREY_LIGHT)
        add_text(s, k, 7.15, y + 0.06, 1.4, 0.42, size=11, color=GREY_TEXT, bold=True)
        add_text(s, v, 8.6, y + 0.06, 4.2, 0.42, size=11, color=GREEN_DARK)
    callout_box(s, "Merchant uses this\nfor redemption", 7.05, 5.9, 2.6, 0.42,
                bg=GOLD, fg=GREEN_DARK, size=10)

    # Arrow
    add_text(s, "1 order\n→\n1+ tokens", 6.2, 3.1, 0.9, 1.2,
             size=10, color=GREY_TEXT, align=PP_ALIGN.CENTER)
    note_bar(s, "Serial number links them: IMA-Y5MNEA-01, IMA-Y5MNEA-02 (one per coupon quantity purchased)")


def slide_split_math(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(s, 0, 0, 13.33, 7.5, fill=CREAM)
    top_bar(s, "50 / 50 Split — How the Money Flows")

    # Big example
    add_rect(s, 0.35, 1.2, 12.63, 2.1, fill=GREEN_DARK)
    add_text(s, "Example: 1 × Roti Prata Combo  ·  S$8 total via PayNow",
             0.6, 1.3, 12, 0.5, size=14, bold=True, color=GOLD)
    # Mosque bar
    add_rect(s, 0.6, 1.9, 5.8, 0.85, fill=GREEN_MID)
    add_text(s, "🕌  S$4  →  Mosque", 0.75, 1.95, 5.6, 0.75,
             size=18, bold=True, color=WHITE)
    add_text(s, "Fundraising proceeds", 0.75, 2.42, 5.6, 0.35,
             size=10, color=RGBColor(0xA8, 0xD5, 0xBE))
    # Merchant bar
    add_rect(s, 6.9, 1.9, 5.8, 0.85, fill=GOLD)
    add_text(s, "🏪  S$4  →  Merchant", 7.05, 1.95, 5.6, 0.75,
             size=18, bold=True, color=GREEN_DARK)
    add_text(s, "Reimbursement for meal served", 7.05, 2.42, 5.6, 0.35,
             size=10, color=GREEN_DARK)

    rules = [
        ("✅", "Zero platform fees",       "PayNow direct — full S$8 received by mosque, no gateway deduction"),
        ("🔒", "Unsettled until redeemed", "Merchant is only paid after they serve the customer — not on purchase"),
        ("📋", "Full audit trail",         "Every token timestamped: created → redeemed → settled"),
        ("🎫", "Multi-coupon orders",       "3 × S$8 = S$24 → 3 separate coupon tokens, each redeemable once"),
        ("📊", "Automatic calculation",    "Settlement page calculates exact amounts — admin just clicks Mark Settled"),
    ]
    for i, (icon, title_r, desc) in enumerate(rules):
        y = 3.55 + i * 0.68
        add_rect(s, 0.35, y, 12.63, 0.62, fill=WHITE, line=0.5, line_color=RGBColor(0xD0, 0xD8, 0xD4))
        add_text(s, icon, 0.5, y + 0.08, 0.4, 0.44, size=14, color=GREEN_DARK)
        add_text(s, title_r, 1.0, y + 0.1, 3.0, 0.4, size=12, bold=True, color=GREEN_DARK)
        add_text(s, desc, 4.1, y + 0.1, 8.7, 0.4, size=11, color=GREY_TEXT)


def slide_closing(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(s, 0, 0, 13.33, 7.5, fill=GREEN_DARK)
    add_rect(s, 0, 0, 0.3, 7.5, fill=GOLD)
    add_rect(s, 0, 6.8, 13.33, 0.7, fill=GOLD)
    add_text(s, "إِمَارَة · Imara", 1, 1.2, 11, 0.8,
             size=26, bold=True, color=GOLD, align=PP_ALIGN.CENTER)
    add_text(s, "Developing · Building · Flourishing", 1, 2.05, 11, 0.6,
             size=16, color=RGBColor(0xA8, 0xD5, 0xBE), align=PP_ALIGN.CENTER)

    creds = [
        ("🔗", "Live URL",    "mosque-os-ai.vercel.app"),
        ("🛡", "Admin login", "admin  /  Imara@2026  → /admin/login"),
        ("🏪", "Merchant",    "PIN: 1234  → /merchant/login"),
        ("💳", "PayNow UEN",  "6596805367"),
        ("📧", "Admin email", "mdghazali.ahmad@gmail.com"),
        ("🎬", "Demo bar",    "Switch personas instantly on every page"),
    ]
    for i, (icon, label, val) in enumerate(creds):
        y = 2.95 + i * 0.6
        add_rect(s, 1.5, y, 10.2, 0.52, fill=GREEN_MID)
        add_text(s, f"{icon}  {label}", 1.65, y + 0.06, 2.5, 0.4,
                 size=12, bold=True, color=GOLD)
        add_text(s, val, 4.3, y + 0.06, 7.2, 0.4, size=12, color=WHITE)

    add_text(s, "Zero platform fees  ·  PayNow  ·  Open source  ·  Built for Singapore mosques",
             1, 6.85, 11, 0.5, size=11, color=GREEN_DARK,
             align=PP_ALIGN.CENTER, bold=True)


# ── BUILD ─────────────────────────────────────────────────────────────────────

def main():
    prs = Presentation()
    prs.slide_width  = Inches(13.33)
    prs.slide_height = Inches(7.5)

    # ── TITLE & OVERVIEW ──────────────────────────────────────────────────────
    slide_title(prs)
    slide_overview(prs)

    # ── SECTION 1: BUYER ─────────────────────────────────────────────────────
    slide_section(prs, 1, "Buyer Flow", "👤",
        "How a community member buys an e-coupon via PayNow")

    slide_with_screenshot(prs,
        step=1, title="Browse Campaigns", persona="👤 Buyer",
        screenshot="02-buyer-campaigns.png",
        callouts=[
            (0.0,  0.0,  2.2, 0.38, "⬅ 8 live campaigns", GREEN_DARK, WHITE),
            (0.0,  4.6,  2.5, 0.38, "Grid / list toggle", GOLD, GREEN_DARK),
            (3.5,  0.3,  2.4, 0.38, "Price shown clearly", GOLD, GREEN_DARK),
        ],
        steps_list=[
            ("🌐", "Visit mosque-os-ai.vercel.app", False),
            ("📋", "No login required — fully public", False),
            ("🛍", "Click any campaign card to view details", False),
            ("💰", "Price, merchant & availability shown", False),
            ("🛒", "Click 'Buy Voucher' to start checkout", True),
        ],
        note="Demo bar → 👤 Buyer lands directly on /campaigns — no navigation needed")

    slide_with_screenshot(prs,
        step=2, title="Checkout & PayNow Payment", persona="👤 Buyer",
        screenshot="05-buyer-paynow.png",
        callouts=[
            (0.0,  0.0,  3.0, 0.38, "📱 Scan QR with bank app", GOLD, GREEN_DARK),
            (0.0,  1.5,  2.8, 0.38, "UEN: 6596805367", GREEN_DARK, WHITE),
            (0.0,  2.2,  3.2, 0.38, "Reference: IMA-XXXXXX", GREEN_DARK, WHITE),
            (0.0,  4.5,  2.5, 0.38, "30-min countdown timer", AMBER, WHITE),
        ],
        steps_list=[
            ("📝", "Fill: name, email, quantity → Proceed", False),
            ("📱", "PayNow QR shown — scan with DBS/OCBC/UOB", False),
            ("🔢", "UEN: 6596805367  (mosque's PayNow ID)", True),
            ("📋", "Use IMA-XXXXXX as payment reference", True),
            ("⏱", "30-minute countdown to complete transfer", False),
            ("✅", "Click 'I've completed payment'", True),
            ("📧", "Buyer gets acknowledgment email", False),
            ("📧", "Admin gets 'New payment to verify' email", True),
        ],
        note="Zero fees — full amount hits mosque bank directly via PayNow, no gateway deduction")

    slide_with_screenshot(prs,
        step=3, title="Payment Success & Order Tracking", persona="👤 Buyer",
        screenshot="07c-buyer-order-status.png",
        callouts=[
            (0.0, 0.0,  3.2, 0.38, "Order Reference prominent", GOLD, GREEN_DARK),
            (0.0, 1.55, 3.5, 0.38, "Step 2 pulsing amber ●", AMBER, WHITE),
            (0.0, 4.4,  3.0, 0.38, "Auto-refreshes every 30s", GREEN_DARK, WHITE),
        ],
        steps_list=[
            ("🎉", "Success page shows reference: IMA-XXXXXX", True),
            ("🔖", "Green 'Check order status →' button to bookmark", False),
            ("🔍", "Nav → Track Order → /orders anytime", False),
            ("📊", "3-step timeline shows current position:", False),
            ("  ✓", "Step 1: Payment initiated", False),
            ("  ●", "Step 2: Awaiting bank verification  ← amber", True),
            ("  ○", "Step 3: Verified — e-coupon sent", False),
            ("🔄", "Auto-refreshes every 30 seconds", True),
        ],
        note="Buyer can bookmark /orders/[reference] — page updates automatically when admin verifies")

    # ── SECTION 2: ADMIN ─────────────────────────────────────────────────────
    slide_section(prs, 2, "Admin Flow", "🛡",
        "How the mosque committee verifies payments and releases e-coupons")

    slide_with_screenshot(prs,
        step=4, title="Admin Dashboard — Pending Verification Panel", persona="🛡 Admin",
        screenshot="11-admin-dashboard.png",
        callouts=[
            (0.0,  0.0,  3.5, 0.38, "🟡 Amber panel = action needed", AMBER, WHITE),
            (0.0,  1.2,  3.5, 0.38, "Order details + amount shown", GREEN_DARK, WHITE),
            (2.5,  3.5,  3.5, 0.38, "Verify & Send E-Coupon →", GOLD, GREEN_DARK),
            (0.0,  4.6,  3.0, 0.38, "KPI cards: totals at a glance", GREEN_MID, WHITE),
        ],
        steps_list=[
            ("📧", "Admin receives email: 'New PayNow payment'", False),
            ("🔐", "Login: admin / Imara@2026 → /admin/login", False),
            ("🟡", "Amber panel appears with order details:", True),
            ("  📋", "Reference, buyer, campaign, amount, time", False),
            ("🏦", "Check mosque bank app — confirm transfer", True),
            ("✅", "Click 'Verify & Send E-Coupon'", True),
            ("🎫", "Coupon token XXXX-XXXX-XXXX generated", False),
            ("📧", "Buyer receives e-coupon email instantly", True),
        ],
        note="Amber panel appears on BOTH /admin dashboard AND /admin/finance — admin can verify from either page")

    slide_with_screenshot(prs,
        step=5, title="Finance, Settlements & Campaigns", persona="🛡 Admin",
        screenshot="12-admin-finance.png",
        callouts=[
            (0.0, 0.0,  3.5, 0.38, "Pending settlement amount", AMBER, WHITE),
            (2.5, 0.5,  2.5, 0.38, "Settle now → link", GOLD, GREEN_DARK),
            (0.0, 3.8,  3.5, 0.38, "Weekly revenue chart", GREEN_DARK, WHITE),
        ],
        steps_list=[
            ("📊", "Finance page: weekly revenue bar chart", False),
            ("🔢", "Campaign performance table (sold vs available)", False),
            ("💰", "Pending settlement box → 'Settle now →'", True),
            ("📋", "Campaigns page: create, edit, set dates", False),
            ("⚙️", "Settings: mosque name, admin email", False),
            ("📈", "KPIs: Total Raised · Donors · Coupons Sold", False),
        ],
        note="All admin pages share the same dark green sidebar — Finance, Campaigns, Settlement, Settings")

    # ── SECTION 3: E-COUPON & MERCHANT ───────────────────────────────────────
    slide_section(prs, 3, "E-Coupon & Merchant Redemption", "🎫",
        "Buyer receives QR code · Merchant scans and redeems")

    slide_with_screenshot(prs,
        step=6, title="Buyer Receives E-Coupon Email", persona="👤 Buyer",
        screenshot="06-buyer-success.png",
        callouts=[
            (0.0, 0.0,  3.5, 0.38, "Reference shown prominently", GOLD, GREEN_DARK),
            (0.0, 2.5,  3.5, 0.38, "'Check order status' button", GREEN_DARK, WHITE),
        ],
        steps_list=[
            ("📧", "Email: 'Your e-coupon is ready'", True),
            ("🎫", "Coupon token: XXXX-XXXX-XXXX", True),
            ("🔗", "'View coupon & QR code →' button in email", True),
            ("📱", "Tap → /coupons/[token] — large QR on screen", False),
            ("✅", "Order tracking: Step 3 now green ✓ 'Verified'", False),
            ("🏪", "Buyer visits merchant and shows QR", True),
            ("📋", "2 coupons bought → 2 separate tokens in email", False),
        ],
        note="If buyer loses the email, they can find the coupon via Nav → Track Order → /orders")

    slide_with_screenshot(prs,
        step=7, title="Merchant Redeems E-Coupon", persona="🏪 Merchant",
        screenshot="21-merchant-redeem.png",
        callouts=[
            (0.0, 0.0,  3.0, 0.38, "Dark sidebar = merchant portal", GREEN_DARK, WHITE),
            (0.0, 0.7,  2.8, 0.38, "📷 Scan QR button", GOLD, GREEN_DARK),
            (0.0, 2.3,  3.2, 0.38, "Or paste token manually", GREEN_MID, WHITE),
        ],
        steps_list=[
            ("🔐", "Demo bar → 🏪 Merchant (bypass PIN for demo)", False),
            ("📷", "OPTION A: Scan QR Code (Android Chrome)", True),
            ("  →", "Camera opens → points at buyer's screen → auto-fill", False),
            ("⌨️", "OPTION B: Paste token XXXX-XXXX-XXXX → Look up", True),
            ("📱", "OPTION C: iPhone native Camera → 'Open in Safari'", False),
            ("✅", "Coupon card: ✓ VALID · campaign · S$XX", True),
            ("🔴", "Click 'Confirm & Mark Redeemed'", True),
            ("📧", "Admin notified by email instantly", True),
        ],
        note="After redemption: merchant sees 'Voucher Redeemed!' — coupon atomically marked, cannot be double-spent")

    slide_with_screenshot(prs,
        step=8, title="Merchant History & KPI Cards", persona="🏪 Merchant",
        screenshot="22-merchant-history.png",
        callouts=[
            (0.0, 0.0,  2.8, 0.38, "Total Redeemed (count)", GREEN_DARK, WHITE),
            (2.2, 0.0,  2.8, 0.38, "Pending Payout (S$)", AMBER, WHITE),
            (4.4, 0.0,  2.0, 0.38, "Total Earned", GREEN_MID, WHITE),
        ],
        steps_list=[
            ("📊", "History page: KPI cards at top", True),
            ("🔢", "Total Redeemed — number of coupons", False),
            ("💰", "Pending Payout — merchant's 50% not yet settled", True),
            ("💵", "Total Earned — all-time merchant portion", False),
            ("📋", "Per-coupon list with dates below KPIs", False),
        ],
        note="Pending Payout clears to S$0 after admin clicks 'Mark Settled' on /admin/settlements")

    # ── SECTION 4: SETTLEMENT ────────────────────────────────────────────────
    slide_section(prs, 4, "Admin Settlement", "💰",
        "Mosque calculates and pays merchant partners")

    slide_with_screenshot(prs,
        step=9, title="Admin Settles with Merchant", persona="🛡 Admin",
        screenshot="13-admin-settlements.png",
        callouts=[
            (0.0, 0.0,  3.5, 0.38, "Grouped by merchant", GREEN_DARK, WHITE),
            (0.0, 1.8,  2.8, 0.38, "50% mosque portion", GREEN_MID, WHITE),
            (3.0, 1.8,  2.8, 0.38, "50% merchant portion", GOLD, GREEN_DARK),
            (2.5, 4.1,  2.5, 0.38, "Mark Settled →", GREEN_DARK, WHITE),
        ],
        steps_list=[
            ("📧", "Admin receives: 'Coupon redeemed · Merchant · S$X'", False),
            ("💰", "Sidebar → Settlement (or Finance → 'Settle now →')", False),
            ("📊", "Page shows redeemed coupons by merchant:", True),
            ("  🕌", "Mosque portion 50%: S$XX  (kept)", True),
            ("  🏪", "Merchant portion 50%: S$XX  (to pay)", True),
            ("🏦", "Admin PayNows S$XX to merchant (manual transfer)", False),
            ("✅", "Click 'Mark Settled' → timestamp recorded", True),
            ("📋", "Settlement only for REDEEMED coupons (service done)", False),
        ],
        note="Settlement is triggered by redemption (service delivered), not purchase — ensures merchant earns only after serving")

    # ── SUPPORTING SLIDES ────────────────────────────────────────────────────
    slide_identifiers(prs)
    slide_split_math(prs)
    slide_closing(prs)

    # ── SAVE ─────────────────────────────────────────────────────────────────
    os.makedirs("docs", exist_ok=True)
    prs.save(OUT_PATH)
    print(f"✅  Saved: {OUT_PATH}")
    print(f"    Slides: {len(prs.slides)}")
    slides_list = [(i+1, s.shapes.title.text if s.shapes.title else "—")
                   for i, s in enumerate(prs.slides)]
    for num, _ in slides_list:
        print(f"    Slide {num:02d}")

if __name__ == "__main__":
    main()
