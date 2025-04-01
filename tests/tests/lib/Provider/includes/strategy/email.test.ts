import { Provider } from "@/lib/Provider/index";
import { describe, test, expect } from "vitest";

describe("Email strategy", () => {
    const provider = new Provider(
        {
            type: "email",
            suggest_local: false,
        },
        () => false
    );

    test("should not request until @ typed", () => {
        expect(provider.canProcessQuery("jam")).toBeFalsy();
    });
});
