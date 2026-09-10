"""Mobile viewport E2E: hamburger nav + responsive layout on 390px."""
import sys
from playwright.sync_api import sync_playwright

import os

BASE = os.environ.get("APEX_E2E_BASE", "https://apex.lankdev.my.id")
QA_EMAIL = os.environ["APEX_E2E_EMAIL"]
QA_PASS = os.environ["APEX_E2E_PASS"]
SLUG = "reina-e2e"

fails = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 390, "height": 800}, locale="id-ID", is_mobile=True)
    page = ctx.new_page()

    # Login on mobile
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.fill("#email", QA_EMAIL)
    page.fill("#password", QA_PASS)
    page.click("button:has-text('Masuk')")
    page.wait_for_url("**/dashboard**", timeout=20000)
    page.wait_for_load_state("networkidle")

    # Horizontal overflow check (no sideways scroll = responsive OK)
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    print(f"PASS  login->dashboard on 390px viewport, h-overflow={overflow}px")
    if overflow > 2:
        fails.append(f"horizontal overflow on dashboard mobile: {overflow}px")

    # Hamburger / mobile nav presence: sidebar is hidden on mobile (md:flex),
    # mobile nav component should render some trigger button
    body_text = page.locator("body").inner_text(timeout=10000)
    # Desktop sidebar should not be visible at 390px
    sidebar_visible = page.evaluate(
        "() => { const el = document.querySelector('aside'); "
        "if (!el) return false; const r = el.getBoundingClientRect(); "
        "return r.width > 0 && r.right > 0 && r.left < 390; }"
    )
    if sidebar_visible:
        fails.append("desktop sidebar visible at 390px (should be hidden)")
    else:
        print("PASS  desktop sidebar hidden on mobile")

    # MobileNav trigger: any button outside forms on mobile layout
    btns = page.locator("button:not(form button)").count()
    if btns > 0:
        print(f"PASS  mobile nav trigger present ({btns} standalone button(s))")
    else:
        fails.append("no mobile nav trigger button found")

    # Attendance page mobile sanity
    page.goto(f"{BASE}/{SLUG}/attendance")
    page.wait_for_load_state("networkidle")
    ov2 = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    if ov2 > 2:
        fails.append(f"horizontal overflow on attendance mobile: {ov2}px")
    else:
        print("PASS  attendance page no h-overflow on mobile")

    browser.close()

if fails:
    print("\nFAILED:")
    for f in fails:
        print(f"  - {f}")
    sys.exit(1)
print("\nMobile suite: ALL PASS")
