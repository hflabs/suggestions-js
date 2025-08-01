import { PLUGIN_OPTIONS } from "../types";

/**
 * Привязать input-элемент в качестве this для всех коллбэков в опциях
 */
export const bindCallbacks = <T>(
    options: PLUGIN_OPTIONS<T>,
    el: HTMLInputElement | HTMLTextAreaElement
) => {
    const bindedValues = Object.entries(options).map(([key, value]) => {
        if (typeof value !== "function") return [key, value];
        return [key, value.bind(el)];
    });

    return Object.fromEntries(bindedValues) as PLUGIN_OPTIONS;
};
