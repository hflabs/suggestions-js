// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext } from "vitest";
import { createSuggestions } from "@/index";
import areSuggestionsVisible from "../../helpers/areSuggestionsVisible";

type ContextWithSuggestions = TestContext & {
    suggestions: ReturnType<typeof createSuggestions>;
};

describe("Keyboard handling", () => {
    const { input, setInputValue, hitKeyDown } = globalThis.createInput();

    beforeEach((context: ContextWithSuggestions) => {
        global.fetchMocker.mockClear();
        context.suggestions = createSuggestions(input, {
            type: "name",
            triggerSelectOnEnter: true,
            triggerSelectOnSpace: true,
            tabDisabled: true,
        });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    describe("when provider is unavailable", () => {
        test("should ignore all keys", (context: ContextWithSuggestions) => {
            context.suggestions.dispose();

            const keys = ["ArrowDown", "Enter", "Space", "Escape", "Tab", "ArrowUp", "KeyA"];

            keys.forEach((key) => {
                const event = hitKeyDown(key);
                expect(event.defaultPrevented).toBe(false);
            });

            expect(areSuggestionsVisible()).toBe(false);
        });
    });

    describe("when suggestions hidden", () => {
        test.each([
            "ArrowUp",
            "Escape",
            "Tab",
            "KeyA",
            "KeyB",
            "Digit1",
            "Backspace",
            "Delete",
            "ENTER",
        ])("%s should NOT prevent default", (key) => {
            const event = hitKeyDown(key);
            expect(event.defaultPrevented).toBe(false);
        });

        test("DOWN should show suggestions and NOT prevent default", async () => {
            global.fetchMocker.mockResponse(JSON.stringify({ suggestions: ["A"] }));
            setInputValue("A");

            const event = hitKeyDown("ArrowDown");
            expect(event.defaultPrevented).toBe(false);

            await globalThis.wait(100);
            expect(areSuggestionsVisible()).toBe(true);
        });

        test("ENTER with triggerSelectOnEnter=false should NOT prevent default", (context: ContextWithSuggestions) => {
            context.suggestions.setOptions({ triggerSelectOnEnter: false });
            const event = hitKeyDown("Enter");
            expect(event.defaultPrevented).toBe(false);
        });

        test("SPACE should NOT prevent default", () => {
            input.value = "A";
            input.selectionStart = 1;
            input.selectionEnd = 1;

            const event = hitKeyDown("Space");
            expect(event.defaultPrevented).toBe(false);
        });
    });

    describe("when suggestions visible", () => {
        beforeEach(async () => {
            global.fetchMocker.mockResponse(JSON.stringify({ suggestions: ["Alice", "Bob"] }));
            setInputValue("A");
            await globalThis.wait(100);
        });

        test.each(["ArrowUp", "ArrowDown", "Escape", "Tab", "Enter"])(
            "%s should prevent default",
            (key) => {
                const event = hitKeyDown(key);
                expect(event.defaultPrevented).toBe(true);
            }
        );

        test.each(["KeyA", "KeyB", "Digit1", "Backspace", "Delete"])(
            "%s should NOT prevent default",
            (key) => {
                const event = hitKeyDown(key);
                expect(event.defaultPrevented).toBe(false);
            }
        );

        test("TAB should NOT prevent default when tabDisabled=false", (context: ContextWithSuggestions) => {
            context.suggestions.setOptions({ tabDisabled: false });
            const event = hitKeyDown("Tab");
            expect(event.defaultPrevented).toBe(false);
        });

        test("ENTER should prevent default even when triggerSelectOnEnter=false", (context: ContextWithSuggestions) => {
            context.suggestions.setOptions({ triggerSelectOnEnter: false });
            const event = hitKeyDown("Enter");
            expect(event.defaultPrevented).toBe(true);
        });

        test("SPACE should prevent default when triggerSelectOnSpace=true and cursor at end", () => {
            input.selectionStart = input.value.length;
            input.selectionEnd = input.value.length;
            const event = hitKeyDown("Space");
            expect(event.defaultPrevented).toBe(true);
        });

        test("SPACE should NOT prevent default when triggerSelectOnSpace=false", (context: ContextWithSuggestions) => {
            context.suggestions.setOptions({ triggerSelectOnSpace: false });
            input.selectionStart = input.value.length;
            input.selectionEnd = input.value.length;
            const event = hitKeyDown("Space");
            expect(event.defaultPrevented).toBe(false);
        });

        test("SPACE should NOT prevent default when cursor not at end", () => {
            input.selectionStart = 0;
            input.selectionEnd = 0;
            const event = hitKeyDown("Space");
            expect(event.defaultPrevented).toBe(false);
        });
    });
});
