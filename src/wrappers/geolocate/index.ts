import type { AnyData } from "@/lib/types";
import type {
    GeoPlugin,
    LocationRequest,
    Geolocation,
    Options as GeoPluginOptions,
} from "@/wrappers/geolocate/types";
import type { PluginWithSpy } from "@/wrappers/optionsSpy/types";

import { getLocation } from "@/utils/geolocation";
import { getParams } from "@/wrappers/granular/helpers/location";
import {
    AVAILABLE_TYPES,
    DEFAULT_GEOLOCATION_ENABLED,
    OPTIONS_ID,
} from "@/wrappers/geolocate/geolocate.constants";
import { WRAPPER_PROXY_FIELD } from "@/wrappers/optionsSpy/options.constants";

// ГЛОБАЛЬНЫЙ промис с запросом геолокации, общий для всех инстансов
let globalLocationPromise: LocationRequest | null = null;

/**
 * Проверяет, можно ли использовать геолокацию:
 * - использование должно быть разрешено для текущего типа
 * - в опциях должно быть разрешено использование геолокации по IP
 */
const canGeolocate = <T extends AnyData = AnyData>(options: GeoPluginOptions<T>) => {
    if (!AVAILABLE_TYPES.includes(options.type)) return false;

    if ("geolocation" in options) return Boolean(options.geolocation);
    return DEFAULT_GEOLOCATION_ENABLED;
};

/**
 * Обертка виджета для получения данных о приоритетной локации (locations_boost).
 * Запрашивает данные через getLocation хэлпер, подставляет полученную локацию в locations_boost в params.
 *
 * Запрос геолокации выполняется единожды, в т.ч. и для других инстансов,
 * хранится в глобальной переменной globalLocationPromise.
 *
 * Обогащает виджет методом getLocation - возвращает текущий глобальный промис геолокации.
 * Добавляет публичное свойство в опции - geolocate: boolean
 */
export const useGeolocation = <T extends AnyData = AnyData>(plugin: PluginWithSpy<T>) => {
    let locationData: Geolocation;

    /**
     * Запрашивает геолокацию, если разрешено,
     * по завершении запроса обновляет locationData
     */
    const checkLocation = async (options: GeoPluginOptions) => {
        if (!canGeolocate(options)) return;

        const currentOptions = plugin[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);

        globalLocationPromise = globalLocationPromise || getLocation(currentOptions);
        locationData = await globalLocationPromise;
    };

    const geoOptions: Partial<GeoPluginOptions<T>> = {
        params: (query) => {
            const currentOptions = plugin[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);

            const customParams = getParams(query, currentOptions.params);
            if (!canGeolocate(currentOptions)) return customParams;

            const locationBoost = locationData ? [{ kladr_id: locationData.data.kladr_id }] : null;
            if (locationBoost) customParams.locations_boost = locationBoost;

            return customParams;
        },
    };

    // добавить опции геолокации к пользовательским
    // + запросить геолокацию если нужно
    plugin[WRAPPER_PROXY_FIELD].subscribe((newOptions) => {
        checkLocation(newOptions as GeoPluginOptions);
        return geoOptions;
    }, OPTIONS_ID);

    const enrichedPlugin = plugin as Omit<PluginWithSpy<T>, "setOptions"> & GeoPlugin<T>;
    enrichedPlugin.getLocation = () => globalLocationPromise || Promise.resolve(null);

    return enrichedPlugin;
};
