import type { EnrichedPlugin } from "@/wrappers/granular/types";
import type { Suggestion } from "@/lib/types";

import { getBoundedSuggestion } from "@/utils/bounds";
import { areSame } from "@/helpers/object";
import { WRAPPER_PROXY_FIELD } from "@/wrappers/optionsSpy/options.constants";
import { OPTIONS_ID } from "@/wrappers/granular/granular.constants";

import { getParams } from "./location";

/**
 * Проверяет, что новая подсказка отличается от уже выбранной в переданном инстансе в рамках границ bounds
 */
export const isSuggestionChanged = (suggestion: Suggestion, instance: EnrichedPlugin) => {
    const selected = instance.getSelection();

    if (!selected) return true;

    const instanceOptions = instance[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);
    const instanceParams = getParams(suggestion.value, instanceOptions.params);
    const type = instanceOptions.type as "address" | "fias";

    const boundedSuggestion = getBoundedSuggestion({
        bounds: instanceParams,
        suggestion,
        type,
    });

    const selectedBounded = getBoundedSuggestion({
        bounds: instanceParams,
        suggestion: selected,
        type,
    });

    return !areSame(selectedBounded?.data, boundedSuggestion.data);
};
