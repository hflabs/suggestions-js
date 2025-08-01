import type { GranularArgs } from "@/wrappers/granular/types";
import type { AnyData } from "@/lib/types";
import type { Options as GeoPluginOptions } from "@/wrappers/geolocate/types";
import type { PublicPlugin } from "@/wrappers/optionsSpy/types";

import { makeGranular } from "@/wrappers/granular/index";
import { createSuggestionsPlugin } from "@/lib";
import { useGeolocation } from "@/wrappers/geolocate/index";
import { isPluginWithSpy, wrapWithOptionsSpy } from "@/wrappers/optionsSpy";

class Suggestions {}

/**
 * Подключает все обертки для виджета (геолокация, гранулярность)
 */
export const createSuggestions = <T extends AnyData = AnyData>(
    el: HTMLInputElement | HTMLTextAreaElement,
    ...[options, parentInstance]: GranularArgs<T, GeoPluginOptions<T>>
) => {
    const plugin = createSuggestionsPlugin<T>(el, options);
    Object.setPrototypeOf(plugin, Suggestions);

    const withOptionsSpy = wrapWithOptionsSpy<T>(plugin);
    const pluginWithGeo = useGeolocation<T>(withOptionsSpy);

    const isParentValid =
        parentInstance && Object.getPrototypeOf(parentInstance) === Object.getPrototypeOf(plugin);

    if (!parentInstance || !isParentValid) {
        type Public = PublicPlugin<T, typeof pluginWithGeo>;
        return pluginWithGeo as { [K in keyof Public]: Public[K] };
    }

    const enrichedParent = isPluginWithSpy(parentInstance)
        ? parentInstance
        : wrapWithOptionsSpy<T>(parentInstance);

    const granular = makeGranular<T, typeof pluginWithGeo>(pluginWithGeo, enrichedParent);

    type Public = PublicPlugin<T, typeof granular>;
    return granular as { [K in keyof Public]: Public[K] };
};

export type { GeoPluginOptions as Options };
