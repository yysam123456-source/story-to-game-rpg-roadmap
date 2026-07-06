"""
QA Test for RPG Core Engine
Tests: status bar, choice weight, condition engine, change feedback, detail drawer
"""
from playwright.sync_api import sync_playwright
import sys

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        # Capture console logs and network errors
        logs = []
        failed_requests = []
        def on_console(msg):
            logs.append(f"[{msg.type}] {msg.text}")
            if msg.type == 'error':
                print(f"  [CONSOLE ERROR] {msg.text}")
        page.on("console", on_console)
        page.on("requestfailed", lambda req: failed_requests.append(req.url))

        # 1. Open game-main.html
        print("[TEST] Opening game-main.html...")
        page.goto("http://localhost:8080/pages/game-main.html", wait_until="domcontentloaded", timeout=10000)
        page.wait_for_timeout(800)
        page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/01-initial.png")

        # 2. Click menu button
        print("[TEST] Opening menu...")
        page.click("button[aria-label='打开菜单']")
        page.wait_for_timeout(300)
        page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/02-menu-open.png")

        # 3. Load RPG story
        print("[TEST] Loading RPG story...")
        page.click("button[aria-label='加载RPG剧本']")
        page.wait_for_timeout(1500)
        page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/03-rpg-loaded.png")

        # 4. Check status bar stats
        print("[TEST] Checking status bar...")
        stats = page.query_selector_all(".mini-stat")
        print(f"  Mini stats count: {len(stats)}")
        for i, stat in enumerate(stats):
            label = stat.query_selector(".stat-label").inner_text()
            value = stat.query_selector(".stat-value").inner_text()
            print(f"  Stat {i}: {label} = {value}")

        # Expand status bar
        page.click("#status-toggle")
        page.wait_for_timeout(600)
        page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/04-status-expanded.png")

        # Check full stats
        full_stats = page.query_selector_all(".stat-item")
        print(f"  Full stats count: {len(full_stats)}")
        for i, stat in enumerate(full_stats):
            stat_type = stat.get_attribute("data-stat-type") or "unknown"
            name_el = stat.query_selector(".stat-name")
            name = name_el.inner_text() if name_el else "?"
            print(f"  Full stat {i}: {name} (type={stat_type})")

        # 5. Check choices and weights
        print("[TEST] Checking choice buttons...")
        choices = page.query_selector_all("#choices-area .choice-btn")
        print(f"  Choice count: {len(choices)}")
        for i, btn in enumerate(choices):
            text = btn.query_selector(".choice-text").inner_text()
            weight = btn.get_attribute("data-weight") or "none"
            disabled = btn.is_disabled()
            classes = btn.get_attribute("class") or ""
            has_weight_class = any(w in classes for w in ["critical", "branch", "minor", "cosmetic"])
            print(f"  Choice {i}: '{text}' weight={weight} disabled={disabled} has_class={has_weight_class}")

        page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/05-choices.png")

        # 6. Hover over critical choice to test tooltip
        critical_btn = page.query_selector(".choice-weight-critical")
        if critical_btn:
            print("[TEST] Hovering over critical choice...")
            critical_btn.hover()
            page.wait_for_timeout(600)
            page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/06-tooltip.png")
            tooltip = page.query_selector(".rpg-choice-tooltip")
            if tooltip:
                print(f"  Tooltip visible: {tooltip.inner_text()}")
            else:
                print("  Tooltip NOT visible")
        else:
            print("[WARN] No critical choice found")

        # 7. Click a choice (minor) and check change feedback
        minor_btn = page.query_selector(".choice-weight-minor")
        if minor_btn and not minor_btn.is_disabled():
            print("[TEST] Clicking minor choice...")
            minor_btn.click()
            page.wait_for_timeout(500)
            page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/07a-choice-clicked.png")
            page.wait_for_timeout(1500)
            page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/07b-after-feedback.png")

            # Check for notifications
            notifs = page.query_selector_all(".notification-toast")
            print(f"  Notifications count: {len(notifs)}")
            for n in notifs:
                print(f"  Notification: {n.inner_text()}")

            # Also check inline feedback
            inline = page.query_selector(".rpg-inline-feedback")
            if inline:
                print(f"  Inline feedback: {inline.inner_text()}")

            # Debug: check if notification container exists and has children
            container = page.query_selector("#notifications")
            if container:
                print(f"  Notification container children: {len(container.query_selector_all('*'))}")
            else:
                print("  Notification container NOT found")

            # Debug: execute JS to check window.rpgCore state
            debug_info = page.evaluate("""
                () => {
                    const core = window.rpgCore;
                    const loader = window.rpgStoryLoader;
                    return {
                        rpgEnabled: core ? core.isEnabled() : false,
                        currentNode: loader ? loader.currentNodeId : null,
                        mindValue: window.state ? window.state.get('mind') : null,
                        rendererExists: !!window.rpgChoiceRenderer,
                        uiExists: !!window.uiController
                    };
                }
            """)
            print(f"  Debug: {debug_info}")
        else:
            print("[WARN] No clickable minor choice found")

        # 8. Test detail drawer (double click status bar)
        print("[TEST] Testing detail drawer...")
        page.dblclick("#status-bar")
        page.wait_for_timeout(500)
        page.screenshot(path="/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots/08-detail-drawer.png")
        drawer = page.query_selector("#rpg-stat-detail-drawer")
        if drawer:
            is_open = "open" in (drawer.get_attribute("class") or "")
            print(f"  Detail drawer open: {is_open}")
            drawer_stats = drawer.query_selector_all(".rpg-drawer-stat")
            print(f"  Drawer stats count: {len(drawer_stats)}")
        else:
            print("  Detail drawer NOT found")

        # Close drawer
        close_btn = page.query_selector(".rpg-drawer-close")
        if close_btn:
            close_btn.click()
            page.wait_for_timeout(300)

        # 9. Check console logs for errors
        print("[TEST] Console logs:")
        errors = [l for l in logs if "error" in l.lower()]
        if errors:
            print(f"  Found {len(errors)} error logs:")
            for e in errors[:10]:
                print(f"    {e}")
        else:
            print("  No errors found")

        # 10. Check failed network requests
        print("[TEST] Failed network requests:")
        if failed_requests:
            print(f"  Found {len(failed_requests)} failed requests:")
            for url in set(failed_requests):
                print(f"    {url}")
        else:
            print("  No failed requests")

        browser.close()
        print("\n[QA] All tests completed. Screenshots saved to qa-screenshots/")
        return len(errors) == 0 and len(failed_requests) == 0

if __name__ == "__main__":
    import os
    os.makedirs("/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots", exist_ok=True)
    success = run_tests()
    sys.exit(0 if success else 1)
