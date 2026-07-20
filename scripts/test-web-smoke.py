from playwright.sync_api import sync_playwright


INVITE_URL = "http://127.0.0.1:4173/free_race/?roomCode=ABCDEF1234"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
    )
    console_errors: list[str] = []
    page.on(
        "console",
        lambda message: (
            console_errors.append(message.text) if message.type == "error" else None
        ),
    )

    page.goto(INVITE_URL)
    page.wait_for_load_state("networkidle")

    page.get_by_text("最后一步，报上名号").wait_for()
    assert page.get_by_role("button", name="加入并开始").is_visible()
    assert page.get_by_label("你的昵称").is_visible()
    assert (
        page.locator('link[rel="manifest"]').get_attribute("href")
        == "/free_race/manifest.json"
    )

    manifest_response = page.request.get(
        "http://127.0.0.1:4173/free_race/manifest.json"
    )
    assert manifest_response.ok
    assert manifest_response.json()["display"] == "standalone"

    serious_errors = [
        message
        for message in console_errors
        if "favicon" not in message.lower()
        and "serviceworker" not in message.lower()
    ]
    assert not serious_errors, serious_errors

    print("WEB_SMOKE_PASS invite-route manifest mobile-layout")
    browser.close()
