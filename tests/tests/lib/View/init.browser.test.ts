import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { expect as playwrightExpect } from "@playwright/test";
import { BASE_URL } from "@/lib/Provider/includes/api/api.constants";
import { type BrowserData } from "@tests/helpers/useBrowser";

const serviceUrl = "https://example.com/some/url";

describe("Plugin init", () => {
    let browserData: BrowserData;

    const checkInitialized = () => {
        test("should request service status", () => {
            expect(browserData.mockServer).toHaveBeenCalledTimes(1);
            expect(browserData.mockServer.mock.calls[0][0].url()).toContain("/status/fio");
        });

        test("should create all additional components", async () => {
            const suggestionsWrapper = await browserData.page.locator(".suggestions-wrapper");
            await playwrightExpect(suggestionsWrapper).toHaveCount(1, { timeout: 100 });
        });
    };

    describe("Visible element", () => {
        beforeEach(async () => {
            browserData = await global.useBrowser();

            await browserData.init({
                type: "name",
                serviceUrl,
            });

            await browserData.page.waitForTimeout(100);
        });

        afterEach(async () => {
            await browserData.dispose();
        });

        test("visible element", async () => {
            expect(browserData.mockServer.mock.calls[0][0].url()).toContain(serviceUrl);
        });

        checkInitialized();
    });

    describe("Check defaults", () => {
        beforeEach(async () => {
            browserData = await global.useBrowser();

            await browserData.init({ type: "name" });
            await browserData.page.waitForTimeout(100);
        });

        afterEach(async () => {
            await browserData.dispose();
        });

        test("serviceUrl", async () => {
            expect(browserData.mockServer.mock.calls[0][0].url()).toContain(BASE_URL);
        });

        checkInitialized();
    });

    describe("Hidden element", () => {
        beforeEach(async () => {
            browserData = await global.useBrowser();

            await browserData.init({ type: "name" }, false);
            await browserData.page.waitForTimeout(100);
        });

        afterEach(async () => {
            await browserData.dispose();
        });

        test("not initialized", async () => {
            expect(browserData.mockServer).not.toHaveBeenCalled();
            const suggestionsWrapper = await browserData.page.locator(".suggestions-wrapper");
            await playwrightExpect(suggestionsWrapper).toHaveCount(0, { timeout: 100 });
        });

        describe("initialize forced on call setSuggestion", () => {
            beforeEach(async () => {
                await browserData.page.evaluate(() => {
                    window.inputEl.style.display = "none";
                    document.body.appendChild(window.inputEl);
                });

                await browserData.page.waitForTimeout(100);

                await browserData.page.evaluate(() => {
                    window.instance.setSuggestion({
                        value: "",
                        unrestricted_value: "",
                        data: {},
                    });
                });

                await browserData.page.waitForTimeout(100);
            });

            checkInitialized();
        });

        describe("initialize on apper in DOM", () => {
            beforeEach(async () => {
                await browserData.page.evaluate(() => {
                    document.body.appendChild(window.inputEl);
                });

                await browserData.page.waitForTimeout(100);
            });

            test("save options", async () => {
                await browserData.dispose();

                browserData = await global.useBrowser();

                await browserData.init(
                    {
                        type: "name",
                        serviceUrl,
                    },
                    false
                );

                await browserData.page.waitForTimeout(100);

                await browserData.page.evaluate(() => {
                    document.body.appendChild(window.inputEl);
                });

                await browserData.page.waitForTimeout(100);

                expect(browserData.mockServer.mock.calls[0][0].url()).toContain(serviceUrl);
            });

            checkInitialized();
        });
    });
});
