import { AnyData } from "@/lib/types";

import { Plugin } from "@/wrappers/types";
import type { PLUGIN_OPTIONS } from "@/lib/View/types";
import type { WRAPPER_PROXY_FIELD } from "./options.constants";

export type Options<O> = Partial<PLUGIN_OPTIONS<O>>;
export type Subscriber<NewOptions> = (options: Options<NewOptions>) => Options<NewOptions> | void;

type Proxy<T extends AnyData> = {
    [WRAPPER_PROXY_FIELD]: {
        /**
         * Подписаться на изменение опций виджета с возможностью добавить кастомные опции.
         * Вызывается при каждом вызове setOptions + один раз при установке
         */
        subscribe: (cb: Subscriber<T>, id: string) => void;
        /**
         * Получить актуальные опции виджета после преобразований подписчиками,
         * не включая подписчика с переданным id и после
         */
        getOptions: (id?: string) => PLUGIN_OPTIONS<T>;
    };
};

export type PluginWithSpy<T extends AnyData = AnyData> = Plugin<T> & Proxy<T>;
export type PublicPlugin<T extends AnyData, P extends PluginWithSpy<T>> = Omit<P, keyof Proxy<T>>;
