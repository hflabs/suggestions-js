import type { SuggestionData } from "@provider/index";

export type SUGGESTION_OPTIONS = SuggestionData & {
    index: number;
    selected: boolean;
};
