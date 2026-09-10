"""Local E2E: register new tenant, verify entitlement UX + admin Status column
+ deactivation flow end-to-end against local dev server + local Supabase."""
import sys
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
SLUG = None
results = {"pass": [], "fail": []}


def check(name, cond, detail=""):
    if cond:
        results["pass"].append(name)
        print(f"  PASS  {name}")
    else:
        results["fail"].append(f"{name} {detail}")
        print(f"  FAIL  {name}  {detail}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    # ========== 1. Register a fresh free-tier company ==========
    print("\n[1] Register fresh tenant (free tier)")
    suffix = str(int(time.time()))[-6:]
    slug = f"e2e-{suffix}"
    page.goto(f"{BASE}/register")
    page.wait_for_load_state("networkidle")
    page.fill("#companyName", f"E2E Local {suffix}")
    page.fill("#slug", slug)
    page.fill("#adminName", "Local Admin")
    page.fill("#email", f"local-admin-{suffix}@e2e.test")
    page.fill("#password", "LocalE2e12345x")
    page.click("button[type='submit']")
    page.wait_for_url("**/admin**", timeout=30000)
    page.wait_for_load_state("networkidle")
    check("register lands in app (admin)", slug in page.url, page.url)
    SLUG = slug

    # ========== 2. Admin page: Status column + Pro locks ==========
    print("\n[2] Admin page entitlement UX (trial active: Pro allowed)")
    page.goto(f"{BASE}/{slug}/admin")
    page.wait_for_load_state("networkidle")
    time.sleep(1.5)
    check("Status column present", page.locator("th:has-text('Status')").count() > 0)
    check("Aktif badge on own row", page.locator("text=Aktif").count() > 0)
    # During trial, Pro modules are selectable (trial = full Pro access)
    shifts_label = page.locator("label:has(input[value='shifts'])").count() + page.locator("label:has-text('Jadwal Shift')").count()
    check("shifts module row present", shifts_label > 0)
    enabled_pro_boxes = page.locator("input[type='checkbox']:not(:disabled)").count()
    check("during trial all module checkboxes enabled", enabled_pro_boxes >= 6, f"enabled={enabled_pro_boxes}")

    # ========== 2b. After trial expiry: Pro modules must lock ==========
    print("\n[2b] After trial expiry (free tier): Pro modules lock")
    import subprocess, json as _json
    db = subprocess.run(
        ["docker", "exec", "supabase_db_APEX", "psql", "-U", "postgres", "-t", "-c",
         f"UPDATE public.companies SET trial_ends_at = NOW() - INTERVAL '1 day' WHERE slug = '{slug}' RETURNING id;"],
        capture_output=True, text=True)
    assert db.returncode == 0, db.stderr
    page.goto(f"{BASE}/{slug}/admin")
    page.wait_for_load_state("networkidle")
    time.sleep(1.5)
    disabled_checkboxes = page.locator("input[type='checkbox']:disabled").count()
    check("Pro module checkboxes disabled after trial", disabled_checkboxes >= 4, f"disabled={disabled_checkboxes}")
    pro_badge = page.locator("span:text-is('Pro')").count()
    check("Pro badges visible after trial", pro_badge >= 4, f"badges={pro_badge}")

    # ========== 3. Pro module pages show upgrade lock screen ==========
    print("\n[3] Pro module lock screens")
    page.goto(f"{BASE}/{slug}/payroll")
    page.wait_for_load_state("networkidle")
    body = page.locator("body").inner_text()
    check("payroll shows upgrade lock", "Pro" in body or "Upgrade" in body or "upgrade" in body.lower(), body[:150])

    page.goto(f"{BASE}/{slug}/shifts")
    page.wait_for_load_state("networkidle")
    body = page.locator("body").inner_text()
    check("shifts shows lock screen", "Pro" in body or "Upgrade" in body, body[:100])

    # ========== 4. Create dummy employee then deactivate ==========
    print("\n[4] Dummy employee + deactivation flow")
    page.goto(f"{BASE}/{slug}/admin")
    page.wait_for_load_state("networkidle")
    # Create dummy account (form submit)
    page.fill("input[placeholder='Employee Full Name']", f"Dummy {suffix}")
    page.locator("form:has(input[placeholder='Employee Full Name']) button[type='submit'], form:has(input[placeholder='Employee Full Name']) button").first.click()
    page.wait_for_load_state("networkidle")
    time.sleep(2.5)
    # find the new dummy row and deactivate
    row = page.locator(f"tr:has-text('Dummy {suffix}')")
    check("dummy row appears in table", row.count() > 0)
    deact = row.locator("button:has-text('Nonaktifkan')")
    if deact.count() > 0:
        deact.first.click()
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        row2 = page.locator(f"tr:has-text('Dummy {suffix}')")
        check("dummy deactivated (badge Nonaktif)", row2.locator("text=Nonaktif").count() > 0)
        # reactivate to leave clean state
        react = row2.locator("button:has-text('Aktifkan')")
        if react.count() > 0:
            react.first.click()
            time.sleep(1.5)
    else:
        results["fail"].append("deactivate button not found")

    # ========== 5. Console errors ==========
    print("\n[5] Console health")
    real = [e for e in errors if "hydration" not in e.lower() and "Warning" not in e]
    check("no page errors during flow", len(real) == 0, "; ".join(real[:2]))

    browser.close()

print("\n" + "=" * 50)
print(f"PASS: {len(results['pass'])}  FAIL: {len(results['fail'])}")
if results["fail"]:
    for f in results["fail"]:
        print(f"  - {f}")
    sys.exit(1)
print("LOCAL E2E: ALL PASS")
