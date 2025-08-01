import type { AnyData, Suggestion } from "@/lib/types";
import type { PLUGIN_OPTIONS } from "@view/types";
import type { ActivePluginData, PluginData } from "@view/index";

import { triggerEvent } from "@view/helpers/triggerEvent";
import { init } from "@view/index";
import { bindCallbacks } from "@view/helpers/bindCallbacks";
import { observeVisibility } from "@view/helpers/observeVisibility";
import { clone } from "@/helpers/object";

/**
 * Создает виджет Подсказок, инициализирует публичные свойства и методы.
 * Подключает Подсказки после появления input элемента в документе.
 */
export const createSuggestionsPlugin = <T extends AnyData = AnyData>(
    el: HTMLInputElement | HTMLTextAreaElement,
    options: PLUGIN_OPTIONS<T>
) => {
    let pluginData: PluginData = { isEnabled: false };
    let bindedOptions = clone(bindCallbacks(options, el));

    const getPlugin = (): ActivePluginData => ({
        isEnabled: true,
        ...init(el, bindedOptions),
    });

    // инициализировать виджет при видимости input'a в документе
    const disconnect = observeVisibility(el, (isVisible, disconnectCB) => {
        pluginData = isVisible ? getPlugin() : { isEnabled: false };
        if (isVisible) disconnectCB();
    });

    return {
        setOptions: <NewOptions = T>(newOptions: Partial<PLUGIN_OPTIONS<NewOptions>>) => {
            bindedOptions = clone({
                ...bindedOptions,
                ...bindCallbacks(newOptions as PLUGIN_OPTIONS, el),
            });

            if (!pluginData.isEnabled) return;

            pluginData.provider.updateOptions(bindedOptions);
            pluginData.inputModel.updateOptions(bindedOptions);

            // в новых опциях могли измениться параметры мобильной ширины - перезапустить observer
            pluginData.mobileObserver.disconnect();
            pluginData.mobileObserver.reset(bindedOptions.mobileWidth);
        },
        disable: () => {
            if (!pluginData.isEnabled) return;
            pluginData.provider.abortSuggestionsRequest();

            pluginData.containerView.hide();
            pluginData.inputModel.updateProvider(undefined);

            pluginData.mobileObserver.disconnect();
        },
        enable: () => {
            if (!pluginData.isEnabled) return;

            pluginData.mobileObserver.reset(bindedOptions.mobileWidth);
            pluginData.inputModel.updateProvider(pluginData.provider);
        },
        dispose: () => {
            disconnect();

            if (!pluginData.isEnabled) return;

            triggerEvent({
                eventName: "suggestions-dispose",
                inputEl: pluginData.inputView.getEl(),
            });

            pluginData.inputView.dispose();
            pluginData.containerView.wrapper.remove();

            pluginData.mobileObserver.disconnect();
            pluginData = { isEnabled: false };
        },
        clear: () => {
            if (!pluginData.isEnabled) return;

            const { provider, inputView, containerView } = pluginData;
            const { chosenSuggestion } = provider;

            provider.clear();

            inputView.setValue("");
            containerView.hide();

            triggerEvent({
                eventName: "suggestions-clear",
                inputEl: inputView.getEl(),
            });

            if (chosenSuggestion) {
                if (typeof bindedOptions.onInvalidateSelection === "function") {
                    bindedOptions.onInvalidateSelection(chosenSuggestion);
                }

                triggerEvent({
                    eventName: "suggestions-invalidateselection",
                    args: { suggestion: chosenSuggestion },
                    inputEl: inputView.getEl(),
                });
            }
        },
        setSuggestion: (suggestion: Suggestion<T>) => {
            if (!pluginData.isEnabled) {
                if (!el) return; // виджет не активен и элемент не существует
                disconnect();
                pluginData = getPlugin();
            }

            const { suggestionValue } = pluginData.provider.setSuggestion(suggestion) || {};

            pluginData.inputView.setValue(suggestionValue || "");
            pluginData.provider.abortSuggestionsRequest();

            triggerEvent({
                eventName: "suggestions-set",
                inputEl: pluginData.inputView.getEl(),
            });
        },
        fixData: (query: string) => {
            pluginData.inputModel?.triggerFixData(query);
        },
        updateSuggestions: () => {
            pluginData.inputModel?.updateSuggestions();
        },
        hide: () => {
            pluginData.containerView?.hide();
        },
        clearCache: () => {
            pluginData.provider?.clearCache();
        },
        getCurrentValue: () => el.value,
        getSelectedIndex: () => pluginData.provider?.chosenSuggestionIndex ?? -1,
        getSelection: <CustomType = T>() => pluginData.provider?.getSelection<CustomType>() ?? null,
        getSuggestions: <CustomType = T>() => {
            if (!pluginData.provider) return [];
            return pluginData.provider.getSuggestions<CustomType>();
        },
        getOptions: <CustomType = T>() => clone(bindedOptions) as PLUGIN_OPTIONS<CustomType>,
        getInput: () => el,
    };
};
