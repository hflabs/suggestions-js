import type { EnrichedPlugin, Options } from "@/wrappers/granular/types";
import type { PluginWithSpy } from "@/wrappers/optionsSpy/types";
import type { AnyData } from "@/lib/types";
import type { Plugin } from "@/wrappers/types";

import { getBoundedValue } from "@/utils/bounds";
import { clone } from "@/helpers/object";
import { WRAPPER_PROXY_FIELD } from "@/wrappers/optionsSpy/options.constants";
import { OPTIONS_ID, WRAPPER_PARENT_FIELD } from "@/wrappers/granular/granular.constants";

import { getLocations, getParams } from "./location";
import { canBeGranular, isParentValid } from "./parent";
import { isSuggestionChanged } from "./suggestion";

/**
 * Формирует опции для основного виджета подсказок для поддержки гранулярности:
 * - params - формирует список ограничений (locations) на основе цепочки родителей
 * - onSelect - при выборе подсказки устанавливает ее в каждый инстанс в цепочке родителей
 * - formatSelected - форматирует значение в текстовом поле при выборе подсказки с учетом границ bounds
 */
export const setGranularOptions = <T extends AnyData, S extends PluginWithSpy<T>>(
    plugin: S,
    parentInstance?: EnrichedPlugin
) => {
    Object.defineProperty(plugin, WRAPPER_PARENT_FIELD, { value: parentInstance });

    const getParentsChain = () => {
        const parentsChain: EnrichedPlugin[] = [];
        let currentParent = parentInstance;

        while (currentParent) {
            if (isParentValid(currentParent, plugin as S & EnrichedPlugin)) {
                parentsChain.push(currentParent);
                currentParent = currentParent[WRAPPER_PARENT_FIELD];
            } else {
                currentParent = undefined;
            }
        }

        return parentsChain;
    };

    const granularOptions: Partial<Options<T>> = {
        params: (query) => {
            const currentOptions = plugin[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);
            const customParams = getParams(query, currentOptions.params);
            if (!canBeGranular(currentOptions.type)) return customParams;

            const locationsParams = getLocations(query, getParentsChain(), currentOptions);
            return {
                ...customParams,
                ...locationsParams,
            };
        },
        onSelect: (suggestion, changed) => {
            const currentOptions = plugin[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);

            if (typeof currentOptions.onSelect === "function") {
                currentOptions.onSelect(suggestion, changed);
            }

            getParentsChain().forEach((instance) => {
                if (!isSuggestionChanged(suggestion, instance)) return;
                instance.setSuggestion(clone(suggestion));
            });
        },
        formatSelected: (suggestion) => {
            const currentOptions = plugin[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);

            if (!canBeGranular(currentOptions.type)) {
                return typeof currentOptions.formatSelected === "function"
                    ? currentOptions.formatSelected(suggestion)
                    : null;
            }

            const params = getParams(suggestion.value, currentOptions.params);
            return getBoundedValue({
                bounds: params,
                suggestion,
                type: currentOptions.type,
            });
        },
    };

    plugin[WRAPPER_PROXY_FIELD].subscribe(() => granularOptions, OPTIONS_ID);

    return plugin as S & EnrichedPlugin;
};

export const isPluginEnriched = <T extends AnyData>(plugin: Plugin<T>): plugin is EnrichedPlugin =>
    WRAPPER_PARENT_FIELD in plugin;
