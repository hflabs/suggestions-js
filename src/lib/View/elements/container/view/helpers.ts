import { CLASSES } from "@view/view.constants";
import type { CONTAINER_OPTIONS } from "../types";

import { renderSuggestionNode } from "./includes/suggestion";

export const getHintHTML = (hint: string | boolean | undefined) =>
    hint ? `<div class="${CLASSES.hint}">${hint}</div>` : "";

// Предоставляет необходимые для рендеринга данные для каждой подсказки,
// навешивает обработчики кликов
export const getSuggestionsNodes = (options: CONTAINER_OPTIONS) =>
    options.suggestions.map((suggestionData, index) => {
        const isSelected = options.selectedIndex === index;

        const { suggestionNode, updateSelection } = renderSuggestionNode({
            ...suggestionData,
            index,
            selected: isSelected,
        });

        const clickHandler = () => options.onClick(index);
        suggestionNode.addEventListener("click", clickHandler);

        return {
            suggestionNode,
            updateSelection,
            clickHandler,
            index,
        };
    });
