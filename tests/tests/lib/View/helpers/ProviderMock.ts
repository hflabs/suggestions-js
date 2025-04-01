import { vi, type Mock } from "vitest";
import { Provider as ProviderClass } from "@/lib/Provider/index";
import { createSuggestions } from "@/index";

type ProviderParams = ConstructorParameters<typeof ProviderClass>;

vi.mock("@/lib/Provider/index", async (importOriginal) => {
    const orig: { Provider: typeof ProviderClass } = await importOriginal();
    return {
        Provider: vi.fn((...args: ProviderParams) => new orig.Provider(...args)),
    };
});

export type ProviderInstance = InstanceType<typeof ProviderClass>;
export type SuggestionsInstance = ReturnType<typeof createSuggestions>;

export default () => ({
    getProviderInstance: (idx: number) => {
        const { results } = (ProviderClass as Mock).mock;
        return results[idx]?.value as ProviderInstance;
    },
    clearProviderMocks: () => (ProviderClass as Mock).mockClear(),
    createSuggestions,
});
