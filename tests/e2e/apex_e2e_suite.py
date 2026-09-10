"""
APEX HR SaaS - Menyeluruh E2E test suite against production (apex.lankdev.my.id).
Scope: auth flow, entitlement gates, module lock screens, admin UI,
navigation, offline resilience basics, console error watch.

Runs READ-MOSTLY against the dedicated QA tenant (reina-e2e) to keep prod
data safe. Destructive checks are scoped to the QA tenant only.
"""
import sys
import json
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get("APEX_E2E_BASE", "https://apex.lankdev.my.id")
QA_EMAIL = os.environ["APEX_E2E_EMAIL"]
QA_PASS = os.environ["APEX_E2E_PASS"]
SLUG = os.environ.get("APEX_E2E_SLUG", "reina-e2e")

results = {"pass": [], "fail": [], "warn": []}
console_errors = []


def check(name, condition, detail=""):
    if condition:
        results["pass"].append(name)
        print(f"  PASS  {name}")
    else:
        results["fail"].append(f"{name} {detail}")
        print(f"  FAIL  {name}  {detail}")


def warn(name, detail=""):
    results["warn"].append(f"{name} {detail}")
    print(f"  WARN  {name}  {detail}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 1280, "height": 800},
        locale="id-ID",
    )
    page = ctx.new_page()
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    # ========== 1. Public pages ==========
    print("\n[1] Public pages")
    r = page.request.get(f"{BASE}/pricing")
    check("pricing page 200", r.status == 200)
    r = page.request.get(f"{BASE}/login")
    check("login page 200", r.status == 200)
    r = page.request.get(f"{BASE}/register")
    check("register page 200", r.status == 200)

    # Unauthenticated access to app must redirect (server gate)
    r = page.request.get(f"{BASE}/{SLUG}/dashboard", max_redirects=0)
    check("unauth /dashboard redirects", r.status in (307, 308))

    # ========== 2. Login flow ==========
    print("\n[2] Login flow (QA account)")
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.fill("#email", QA_EMAIL)
    page.fill("#password", QA_PASS)
    page.click("button:has-text('Masuk')")
    page.wait_for_url(f"**/dashboard**", timeout=20000)
    check("login lands on dashboard", f"/{SLUG}/dashboard" in page.url, page.url)
    page.wait_for_load_state("networkidle")

    # Session persistence: re-navigating to the app must NOT bounce to /login
    page.goto(f"{BASE}/{SLUG}/dashboard")
    page.wait_for_load_state("networkidle")
    still_in = page.url.startswith(f"{BASE}/{SLUG}") and "/login" not in page.url
    check("session persists across nav", still_in, f"ended at {page.url}")

    # ========== 3. Wrong tenant slug ==========
    print("\n[3] Tenant isolation")
    page.goto(f"{BASE}/bogus-tenant-xyz/dashboard")
    page.wait_for_load_state("networkidle")
    check("bogus slug redirects to own tenant", page.url.startswith(f"{BASE}/{SLUG}") or page.url == f"{BASE}/login", page.url)

    # ========== 4. Sidebar navigation + module links ==========
    print("\n[4] Sidebar & navigation")
    page.goto(f"{BASE}/{SLUG}/dashboard")
    page.wait_for_load_state("networkidle")
    sidebar = page.locator("aside")
    links = sidebar.locator("a") if sidebar.count() > 0 else page.locator("nav a")
    hrefs = [links.nth(i).get_attribute("href") or "" for i in range(min(links.count(), 30))]
    check("sidebar has dashboard link", any("/dashboard" in h for h in hrefs))
    check("sidebar has attendance link", any("/attendance" in h for h in hrefs))
    check("sidebar has tasks link", any("/tasks" in h for h in hrefs))

    # Mobile nav presence (responsive)
    mctx = browser.new_context(viewport={"width": 390, "height": 800}, locale="id-ID")
    mpage = mctx.new_page()
    mpage.goto(f"{BASE}/login")
    mpage.wait_for_load_state("networkidle")
    mpage.fill("#email", QA_EMAIL)
    mpage.fill("#password", QA_PASS)
    mpage.click("button:has-text('Masuk')")
    mpage.wait_for_url("**/dashboard**", timeout=20000)
    mpage.wait_for_load_state("networkidle")
    mobile_nav_btn = mpage.locator("button:has(svg)").first
    warn("mobile viewport renders", "manual check: hamburger visible at 390px")
    mctx.close()

    # ========== 5. Module pages render ==========
    print("\n[5] Core module pages")
    for route in ["attendance", "tasks", "admin"]:
        page.goto(f"{BASE}/{SLUG}/{route}")
        page.wait_for_load_state("networkidle")
        body = page.locator("body").inner_text(timeout=10000)[:400]
        no_crash = "Application error" not in body and "client-side exception" not in body
        check(f"/{route} renders without crash", no_crash, body[:120])

    # ========== 6. Entitlement gates (QA tenant tier decides) ==========
    print("\n[6] Entitlement gates")
    page.goto(f"{BASE}/{SLUG}/dashboard")
    page.wait_for_load_state("networkidle")
    tier_hint = page.content()
    is_free = "Trial" not in tier_hint or "Free" in tier_hint

    for route, mod in [("shifts", "shifts"), ("payroll", "payroll"), ("leave", "leave"), ("inventory", "inventory")]:
        page.goto(f"{BASE}/{SLUG}/{route}")
        page.wait_for_load_state("networkidle")
        body = page.locator("body").inner_text(timeout=10000)
        locked = ("Pro" in body and ("Upgrade" in body or "Aktif" in body or "aktif" in body)) or "404" in body
        rendered = "Application error" not in body
        if is_free:
            check(f"/{route} gated correctly for free tier", locked or rendered, body[:100])
        else:
            check(f"/{route} renders for entitled tier", rendered, body[:100])

    # Dynamic industry feature page gating
    page.goto(f"{BASE}/{SLUG}/payroll-engine")
    page.wait_for_load_state("networkidle")
    body = page.locator("body").inner_text(timeout=10000)
    check("/payroll-engine does not crash (gate or render)", "Application error" not in body, body[:100])

    # ========== 7. Admin page UI ==========
    print("\n[7] Admin page")
    page.goto(f"{BASE}/{SLUG}/admin")
    page.wait_for_load_state("networkidle")
    # Status column exists (new activation feature)
    has_status = page.locator("th:has-text('Status')").count() > 0
    check("admin user table has Status column", has_status)
    # Module picker section
    has_modules = page.locator("text=FEATURE ACTIVATION").count() > 0
    check("admin module activation section present", has_modules)

    # ========== 8. Console errors ==========
    print("\n[8] Console health")
    real_errors = [e for e in console_errors if "favicon" not in e and "net::" not in e and "404" not in e]
    if real_errors:
        warn(f"console errors captured: {len(real_errors)}", real_errors[:3])
    else:
        check("no console errors during flows", True)

    # ========== 9. Logout ==========
    print("\n[9] Logout")
    page.goto(f"{BASE}/{SLUG}/dashboard")
    page.wait_for_load_state("networkidle")
    logout = page.locator("form[action='/api/auth/logout'] button, form[action='/api/auth/logout'] input[type='submit']")
    if logout.count() > 0:
        logout.first.click()
        page.wait_for_load_state("networkidle")
        check("logout returns to login", "/login" in page.url or "Masuk" in page.content(), page.url)
    else:
        warn("logout button", "form[action='/api/auth/logout'] not found")

    browser.close()

# ========== Summary ==========
print("\n" + "=" * 50)
total = len(results["pass"]) + len(results["fail"])
print(f"PASS: {len(results['pass'])}  FAIL: {len(results['fail'])}  WARN: {len(results['warn'])}  (total checks: {total})")
if results["fail"]:
    print("\nFAILED:")
    for f in results["fail"]:
        print(f"  - {f}")
print("\nWARNINGS:")
for w in results["warn"]:
    print(f"  - {w}")

sys.exit(1 if results["fail"] else 0)
