import { createElement } from "@/helpers/dom";
import { CLASSES } from "@view/view.constants";
import type { SUGGESTION_OPTIONS } from "./types";

import { buildContent } from "./helpers";

/**
 * Рендерит html для подсказки с подсвеченными совпадениями.
 *
 * Если передан formattedResult - использует его в качестве контента,
 * иначе - генерирует контент из матчей.
 *
 * Предоставляет метод updateSelection для управления состоянием "выбранности" подсказки
 */
export const renderSuggestionNode = (options: SUGGESTION_OPTIONS) => {
    const suggestionNode = createElement({
        tagName: "div",
        attributes: {
            className: CLASSES.suggestion + (options.selected ? ` ${CLASSES.selected}` : ""),
            dataset: { index: `${options.index}` },
        },
    });

    if (options.formattedResult) {
        suggestionNode.innerHTML = options.formattedResult;
    } else {
        suggestionNode.appendChild(buildContent(options));
    }

    const updateSelection = (selected: boolean) => {
        suggestionNode.classList.remove(CLASSES.selected);
        if (selected) suggestionNode.classList.add(CLASSES.selected);
    };

    return {
        suggestionNode,
        updateSelection,
    };
};
