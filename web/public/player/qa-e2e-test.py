"""
End-to-End QA Test: Full user flow
Open → Menu → Import Story → Play → Ending
"""
from playwright.sync_api import sync_playwright
import os, json

SCREENSHOT_DIR = "/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/qa-screenshots"
DEMO_JSON = "/Users/Lenovo/.trae-cn/work/6a466079be5ccd3a16fe6eab/story-to-game-rpg-roadmap/rpg-game-ui-v2/demo-rpg-story.json"

def run_tests():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        errors = []
        def on_console(msg):
            if msg.type == 'error':
                errors.append(msg.text)
        page.on("console", on_console)

        # === STEP 1: Open game-main.html ===
        print("[1/8] Opening game-main.html...")
        page.goto("http://localhost:8080/pages/game-main.html", wait_until="domcontentloaded", timeout=10000)
        page.wait_for_timeout(800)
        page.screenshot(path=f"{SCREENSHOT_DIR}/e2e-01-initial.png")
        results.append(("Open page", True))

        # === STEP 2: Open menu, verify import button exists ===
        print("[2/8] Opening menu...")
        page.click("button[aria-label='打开菜单']")
        page.wait_for_timeout(300)
        page.screenshot(path=f"{SCREENSHOT_DIR}/e2e-02-menu.png")
        import_btn = page.query_selector("#menu-import-story")
        has_import = import_btn is not None
        print(f"  Import button: {has_import}")
        results.append(("Menu has import button", has_import))

        # === STEP 3: Click import, verify overlay shows ===
        print("[3/8] Opening import overlay...")
        page.click("#menu-import-story")
        page.wait_for_timeout(300)
        page.screenshot(path=f"{SCREENSHOT_DIR}/e2e-03-import-overlay.png")
        overlay = page.query_selector("#story-import-overlay")
        has_overlay = overlay is not None and "hidden" not in (overlay.get_attribute("class") or "")
        print(f"  Import overlay visible: {has_overlay}")
        results.append(("Import overlay visible", has_overlay))

        # === STEP 4: Upload JSON file via file input ===
        print("[4/8] Uploading demo-rpg-story.json...")
        file_input = page.query_selector("#story-file-input")
        if file_input:
            file_input.set_input_files(DEMO_JSON)
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{SCREENSHOT_DIR}/e2e-04-file-loaded.png")
            status = page.query_selector("#story-import-status")
            if status:
                print(f"  Status text: {status.inner_text()}")
                print(f"  Status class: {status.get_attribute('class')}")
            results.append(("File upload", True))
        else:
            results.append(("File upload", False))

        # === STEP 5: Verify RPG mode activated ===
        print("[5/8] Verifying RPG mode...")
        page.wait_for_timeout(1000)
        rpg_debug = page.evaluate("""() => ({
            enabled: window.rpgCore ? window.rpgCore.isEnabled() : false,
            genre: window.rpgCore ? window.rpgCore.getGenre() : null,
            storyMode: window.rpgStoryLoader ? window.rpgStoryLoader.isStoryMode : false,
            currentNode: window.rpgStoryLoader ? window.rpgStoryLoader.currentNodeId : null,
            stats: window.state ? {
                realm: window.state.get('realm'),
                cultivation: window.state.get('cultivation'),
                spiritual: window.state.get('spiritual')
            } : null
        })""")
        print(f"  RPG Debug: {rpg_debug}")
        rpg_ok = rpg_debug['enabled'] and rpg_debug['storyMode'] and rpg_debug['currentNode'] == 'start'
        results.append(("RPG mode activated", rpg_ok))

        # Check mode indicator
        indicator = page.query_selector("#story-mode-indicator")
        indicator_visible = indicator is not None and indicator.is_visible()
        print(f"  Mode indicator visible: {indicator_visible}")
        if indicator_visible:
            print(f"  Mode text: {indicator.query_selector('#story-mode-text').inner_text()}")

        # === STEP 6: Verify status bar ===
        print("[6/8] Checking status bar...")
        mini_stats = page.query_selector_all(".mini-stat")
        print(f"  Mini stats: {len(mini_stats)}")
        for i, stat in enumerate(mini_stats):
            label = stat.query_selector(".stat-label").inner_text()
            value = stat.query_selector(".stat-value").inner_text()
            print(f"    {label} = {value}")
        results.append(("Status bar shows stats", len(mini_stats) >= 3))

        # Expand status bar
        page.click("#status-toggle")
        page.wait_for_timeout(400)
        page.screenshot(path=f"{SCREENSHOT_DIR}/e2e-06-status-expanded.png")
        full_stats = page.query_selector_all(".stat-item")
        print(f"  Full stats: {len(full_stats)}")

        # === STEP 7: Verify choices with weights ===
        print("[7/8] Checking choices...")
        choices = page.query_selector_all("#choices-area .choice-btn")
        print(f"  Choices: {len(choices)}")
        weight_classes = set()
        for btn in choices:
            cls = btn.get_attribute("class") or ""
            for w in ["critical", "branch", "minor", "cosmetic"]:
                if w in cls:
                    weight_classes.add(w)
        print(f"  Weight classes: {weight_classes}")
        results.append(("Choice weights", len(weight_classes) >= 3))
        page.screenshot(path=f"{SCREENSHOT_DIR}/e2e-07-choices.png")

        # === STEP 8: Click a choice and verify flow ===
        print("[8/8] Making a choice...")
        branch_btn = page.query_selector(".choice-weight-branch")
        if branch_btn and not branch_btn.is_disabled():
            branch_btn.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{SCREENSHOT_DIR}/e2e-08-after-choice.png")

            # Verify node changed
            new_debug = page.evaluate("() => window.rpgStoryLoader ? window.rpgStoryLoader.currentNodeId : null")
            print(f"  New node: {new_debug}")
            results.append(("Node navigation", new_debug != 'start'))

            # Verify notifications
            container = page.query_selector("#notifications")
            notif_count = len(container.query_selector_all(".notification-toast")) if container else 0
            print(f"  Notifications: {notif_count}")
            results.append(("Change feedback notifications", notif_count > 0))
        else:
            results.append(("Node navigation", False))
            results.append(("Change feedback notifications", False))

        # Summary
        print("\n" + "="*50)
        print("E2E TEST RESULTS")
        print("="*50)
        passed = 0
        for name, ok in results:
            status = "PASS" if ok else "FAIL"
            print(f"  [{status}] {name}")
            if ok: passed += 1
        print(f"\n{passed}/{len(results)} passed")

        if errors:
            print(f"\nConsole errors ({len(errors)}):")
            for e in set(errors):
                print(f"  {e}")

        browser.close()
        return passed == len(results) and len(errors) == 0

if __name__ == "__main__":
    import sys
    sys.exit(0 if run_tests() else 1)
