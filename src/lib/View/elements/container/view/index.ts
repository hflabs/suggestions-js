import { createElement } from "@/helpers/dom";
import { CLASSES } from "@view/view.constants";
import type { CONTAINER_OPTIONS } from "@view/elements/container/types";

import { renderPromo } from "./includes/promo";
import { getHintHTML, getSuggestionsNodes } from "./helpers";

/**
 * Компонент контейнера со списком подсказок
 * Рендерит wrapper, видимый на странице всегда и container с подсказками внутри него.
 * Навешивает обработчик кликов на каждую подсказку (обработчик предоставляется в oprions)
 *
 * Предоставляет методы:
 * - render(options): отрендерить список подсказок из options (если есть)
 * или вывести noSuggestionsHint (если есть)
 * - hide: очищает содержимое container и скрывает его
 * - updateSelected: вручную изменить индекс "выбранной" в списке подсказки
 */
export class ContainerView {
    private _container: HTMLDivElement;
    private _suggestionsNodes: ReturnType<typeof getSuggestionsNodes> = [];
    private _closeTimer: NodeJS.Timeout | undefined;
    private _closeDelay = 0;

    isVisible: boolean = false;
    wrapper: HTMLDivElement;

    constructor() {
        this.wrapper = createElement({
            tagName: "div",
            attributes: { className: CLASSES.wrapper },
        });

        this._container = createElement({
            tagName: "div",
            attributes: { className: CLASSES.container },
        });

        this._container.style.display = "none";
        this.wrapper.appendChild(this._container);

        // предотвратить получение фокуса при клике (фокус остается на инпуте)
        this.wrapper.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });
    }

    render(options: CONTAINER_OPTIONS) {
        this._closeDelay = typeof options.closeDelay === "number" ? options.closeDelay : 0;

        clearTimeout(this._closeTimer);

        // нет подсказок для вывода и нет текста noSuggestionsHint - выводить нечего
        if (!options.suggestions.length && !options.noSuggestionsHint) {
            this.hide();
            return;
        }

        if (!options.suggestions.length) {
            // вывод пустого контейнера с noSuggestionsHint
            this._container.innerHTML = getHintHTML(options.noSuggestionsHint);
        } else {
            // вывод контейнера со списком подсказок
            const hintHtml = getHintHTML(options.hint);
            this._container.innerHTML = hintHtml;
            this._container.classList.toggle(CLASSES.containerWithoutHint, !hintHtml);

            this._suggestionsNodes = getSuggestionsNodes(options);

            this._suggestionsNodes.forEach(({ suggestionNode }) =>
                this._container.appendChild(suggestionNode)
            );
        }

        const promo = renderPromo(options.planName);
        if (promo) this._container.appendChild(promo);

        this._container.classList.toggle(CLASSES.containerWithPromo, Boolean(promo));

        if (typeof options.beforeRender === "function") options.beforeRender(this._container);

        this._container.style.display = "block";
        this.wrapper.classList.add(CLASSES.wrapper_active);
        this.isVisible = true;
    }

    hide() {
        this.wrapper.classList.remove(CLASSES.wrapper_active);
        this.isVisible = false;

        this._suggestionsNodes.forEach(({ suggestionNode, clickHandler }) => {
            suggestionNode.removeEventListener("click", clickHandler);
        });

        this._suggestionsNodes = [];

        this._closeTimer = setTimeout(() => {
            this._container.style.display = "none";
            this._container.innerHTML = "";
        }, this._closeDelay);
    }

    updateSelected(selectedIndex: number) {
        this._suggestionsNodes.forEach(({ updateSelection, index }) => {
            updateSelection(index === selectedIndex);
        });
    }
}
