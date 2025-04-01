import type { Options, EnrichedPlugin } from "@/wrappers/granular/types";

import { getBoundsIds } from "@/utils/bounds/helpers";
import { getParams } from "@/wrappers/granular/helpers/location";

import { WRAPPER_PROXY_FIELD } from "@/wrappers/optionsSpy/options.constants";
import { OPTIONS_ID } from "@/wrappers/granular/granular.constants";

/**
 * Проверяет, поддерживает ли переданный тип подсказок гранулярность
 */
export const canBeGranular = (type: Options["type"]): type is "address" | "fias" =>
    ["address", "fias"].includes(type);

/**
 * Проверяет, может ли родительский инстанс подсказок ограничивать текущий инстанс
 */
export const isParentValid = (parentInstance: EnrichedPlugin, currentInstance: EnrichedPlugin) => {
    const parentOptions = parentInstance[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);
    const instanceOptions = currentInstance[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);

    if (!canBeGranular(parentOptions.type) || !canBeGranular(instanceOptions.type)) return false;
    if (parentOptions.type !== instanceOptions.type) return false;

    const parentBounds = getParams(parentInstance.getCurrentValue?.() || "", parentOptions.params);
    const currentBounds = getParams(
        currentInstance.getCurrentValue() || "",
        instanceOptions.params
    );

    const parentBoundsIds = getBoundsIds(parentBounds, parentOptions.type, true);
    const currentBoundsIds = getBoundsIds(currentBounds, instanceOptions.type, true);

    const parentBoundsValid = getBoundsIds(parentBounds, parentOptions.type).length > 0;

    return parentBoundsIds.every((id) => currentBoundsIds.includes(id)) && parentBoundsValid;
};
