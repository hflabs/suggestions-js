import { chromium, Request } from "@playwright/test";
import path from "path";
import { vi } from "vitest";

import { PLUGIN_OPTIONS } from "@/lib/View/types";

const useBrowser = async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const mockServer = vi.fn<(req: Request) => object>(() => ({}));

    await page.route("**/*", (route) => {
        const resourceType = route.request().resourceType();

        if (resourceType !== "fetch") {
            route.continue();
        } else {
            mockServer(route.request());

            route.fulfill({
                contentType: "application/json",
                body: JSON.stringify({}),
            });
        }
    });

    await page.goto(
        new URL(`file://${path.join(__dirname, "../assets", "index.html")}`).toString()
    );

    await page.addScriptTag({
        path: path.join(__dirname, "../../dist/suggestions.min.js"),
    });

    const init = (options: PLUGIN_OPTIONS, appendInput = true) =>
        page.evaluate(
            (config: { options: PLUGIN_OPTIONS; appendInput: boolean }) => {
                const input = document.createElement("input");
                if (config.appendInput) document.body.appendChild(input);

                window.inputEl = input;
                window.instance = window.Dadata.createSuggestions(input, config.options);
            },
            {
                options,
                appendInput,
            }
        );

    const dispose = async () => {
        await page.evaluate(() => {
            window.inputEl.remove();
            window.instance.dispose();
        });
    };

    return {
        page,
        browser,
        mockServer,
        init,
        dispose,
    };
};

export default useBrowser;

export type BrowserData = Awaited<ReturnType<typeof useBrowser>>;
