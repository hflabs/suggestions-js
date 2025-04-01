import { AnyData } from "@/lib/types";
import type { PluginWithSpy } from "@/wrappers/optionsSpy/types";

import { isParentValid } from "./helpers/parent";
import { setGranularOptions, isPluginEnriched } from "./helpers";

/**
 * Обертка для реализации гранулярности и ограничения локации поиска для подсказок.
 *
 * Для подсказок по адресам и ФИАС принимает родительский экземпляр подсказок
 * и ограничивает поиск в соответствии с его данными.
 */
export const makeGranular = <T extends AnyData, S extends PluginWithSpy<T>>(
    plugin: S,
    parentInstance: PluginWithSpy<T>
): S => {
    const enrichedParent = isPluginEnriched(parentInstance)
        ? parentInstance
        : setGranularOptions<T, PluginWithSpy<T>>(parentInstance);

    const enrichedPlugin = setGranularOptions<T, S>(plugin, enrichedParent);
    const parentInput = enrichedParent.getInput();

    const handleInvalidate = () => {
        if (!isParentValid(enrichedParent, enrichedPlugin)) return;
        enrichedPlugin.clear();
    };

    // выбранная подсказка может измениться без вызова invalidateselection - очистить текущий инстанс
    // (например при вызове fixData или выборе новой подсказки после фокуса в поле)
    const handleSelect = (e: Event) => {
        const { suggestionChanged } = (e as CustomEvent).detail;
        if (!isParentValid(enrichedParent, enrichedPlugin) || !suggestionChanged) return;
        enrichedPlugin.clear();
    };

    const handleDispose = () => {
        if (!isParentValid(enrichedParent, enrichedPlugin)) return;
        parentInput.removeEventListener("suggestions-invalidateselection", handleInvalidate);
        parentInput.removeEventListener("suggestions-select", handleSelect);
    };

    parentInput.addEventListener("suggestions-invalidateselection", handleInvalidate);
    parentInput.addEventListener("suggestions-select", handleSelect);
    parentInput.addEventListener("suggestions-dispose", handleDispose);

    return enrichedPlugin;
};
