import type { AnyData } from "@/lib/types";
import type { Plugin } from "@/wrappers/types";

import { clone } from "@/helpers/object";
import type { PluginWithSpy, Subscriber } from "./types";

import { WRAPPER_PROXY_FIELD } from "./options.constants";

/**
 * Обертка, проксирующая доступ к методу setOptions виджета.
 *
 * Позволяет расширить переданные пользователем опции
 * (как при инициации виджета, так и позже при вызове setOptions).
 *
 * Предоставляет метод для получения последних опций виджета,
 * трансформированных всеми предыдущими подписчиками.
 */
export const wrapWithOptionsSpy = <T extends AnyData = AnyData>(plugin: Plugin<T>) => {
    const subscribers: { cb: Subscriber<T>; id: string }[] = [];
    const currentOptions = plugin.getOptions();

    const setPluginOptions = plugin.setOptions;

    // Ловушка на публичный метод setOptions
    plugin.setOptions = (userOptions) => {
        // Сохранить "чистые" опции до преобразований как базу
        Object.assign(currentOptions, clone(userOptions));

        const finalParams = clone(currentOptions);
        // Вызвать всех подписчиков по-очереди и обновить finalParams после каждого вызова.
        // Каждый подписчик получает на вход опции после предыдущего преобразования.
        subscribers.forEach((callback) => {
            Object.assign(finalParams, callback.cb(finalParams) || {});
        });

        // Установить в виджет опции после всех трансормаций
        setPluginOptions(finalParams);
    };

    // Получить опции с выполненными преобразованиями по цепочке коллбэков до id
    // для случаев, когда нужно получить доступ к опциям виджета вне subscribe/setOptions
    // (например, в другом инстансе)
    const getOptions = (id?: string) => {
        const index = subscribers.findIndex((s) => s.id === id);

        if (index === -1) return currentOptions;

        // все предыдущие коллбэки
        const callbacks = subscribers.slice(0, index);

        const finalParams = clone(currentOptions);
        callbacks.forEach((callback) => {
            Object.assign(finalParams, callback.cb(finalParams) || {});
        });

        return finalParams;
    };

    // Cохранить нового подписчика и сразу установить опции, которые он вернет
    // (новые подписчики перекрывают повторяющиеся пункты от предыдущих,
    // поэтому должны сами реализовывать мердж таких параметров)
    const subscribe = (cb: Subscriber<T>, id: string) => {
        subscribers.push({
            cb,
            id,
        });

        // опции с преобразованиями из всей предыдущей цепочки коллбэков
        const prevOptions = getOptions(id);

        const custom = cb(clone(prevOptions));
        if (custom) setPluginOptions(custom);
    };

    const optionsProxy = {
        subscribe,
        getOptions,
    };

    Object.defineProperty(plugin, WRAPPER_PROXY_FIELD, { value: optionsProxy });

    plugin.getOptions = (() => clone(currentOptions)) as PluginWithSpy<T>["getOptions"];

    return plugin as PluginWithSpy<T>;
};

export const isPluginWithSpy = <T extends AnyData>(plugin: Plugin<T>): plugin is PluginWithSpy<T> =>
    WRAPPER_PROXY_FIELD in plugin;
