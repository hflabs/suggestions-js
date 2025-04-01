import type { AnyData } from "@/lib/types";
import type { PLUGIN_OPTIONS } from "@/lib/View/types";
import type { getLocation } from "@/utils/geolocation";

type GeoOptions = { geolocation?: boolean };

export type LocationRequest = ReturnType<typeof getLocation>;
export type Geolocation = Awaited<LocationRequest>;

export type Options<T = AnyData> = PLUGIN_OPTIONS<T> & {
    geolocation?: boolean;
};

export type GeoPlugin<T extends AnyData = AnyData> = {
    setOptions: <NewOptions = T>(newOptions: Partial<Options<NewOptions>>) => void;
    getLocation: () => LocationRequest;
};
