import type { AnyData } from "@/lib/types";
import { createSuggestionsPlugin } from "@/lib";

export type Plugin<T extends AnyData = AnyData> = ReturnType<typeof createSuggestionsPlugin<T>>;
