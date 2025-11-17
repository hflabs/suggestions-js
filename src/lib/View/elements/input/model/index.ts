import type { Provider } from "@/lib/Provider";

import {
    KEYS,
    DEFAULT_SCROLL_ON_FOCUS,
    DEFAULT_TAB_DISABLED,
    DEFAULT_TRIGGER_SELECT_ON_BLUR,
    DEFAULT_TRIGGER_SELECT_ON_ENTER,
    DEFAULT_TRIGGER_SELECT_ON_SPACE,
} from "@view/view.constants";
import { areSame } from "@/helpers/object";
import { ModelArgs } from "./types";
import { BaseInputModel } from "./includes/base";
import { InputNavigateModel } from "./includes/navigate";
import { InputSelectModel } from "./includes/select";
import { InputSuggestModel } from "./includes/suggest";

type SuggestionsData = Awaited<ReturnType<Provider["fetchSuggestions"]>>;

/**
 * Класс, поставляющий методы для обработки событий на элементе
 *
 * Возвращает:
 * - getListeners - метод для получения всех обработчиков событий
 * - updateSuggestions - метод для запроса и вывода списка подсказок по текущему значению в элементе
 * - triggerFixData - метод для запроса 1 подсказки по текущему значению в элементе
 * - updateOptions - метод для обновления текущих опций виджета
 * - updateProvider - метод для установки провайдера
 */
export class InputModel extends BaseInputModel {
    private _suggestModel: InstanceType<typeof InputSuggestModel>;
    private _selectModel: InstanceType<typeof InputSelectModel>;
    private _navigateModel: InstanceType<typeof InputNavigateModel>;
    private _getIsMobile: () => boolean;

    triggerFixData: InstanceType<typeof InputSelectModel>["triggerFixData"];

    constructor(getIsMobile: () => boolean, args: ModelArgs) {
        super(args);

        this._getIsMobile = getIsMobile;

        this._suggestModel = new InputSuggestModel(args);
        this._selectModel = new InputSelectModel(args);
        this._navigateModel = new InputNavigateModel(args);

        this.triggerFixData = this._selectModel.triggerFixData.bind(this._selectModel);
    }

    async updateSuggestions() {
        const suggestionsData = await this._provider?.fetchSuggestions(this._view.getValue());
        if (suggestionsData) this._triggerRender(suggestionsData);
    }

    updateOptions(...args: Parameters<InstanceType<typeof BaseInputModel>["updateOptions"]>) {
        super.updateOptions(...args);
        this._suggestModel.updateOptions(...args);
        this._selectModel.updateOptions(...args);
        this._navigateModel.updateOptions(...args);
    }

    updateProvider(...args: Parameters<InstanceType<typeof BaseInputModel>["updateProvider"]>) {
        super.updateProvider(...args);
        this._suggestModel.updateProvider(...args);
        this._selectModel.updateProvider(...args);
        this._navigateModel.updateProvider(...args);
    }

    getListeners() {
        // отложить обработку события фокуса на 10ms на случай подряд идущих событий focus/blur
        const delayedFocusHandler = () => {
            setTimeout(this._handleFocus.bind(this), 10);
        };

        return {
            input: this._handleInput.bind(this) as EventListener,
            focus: delayedFocusHandler as EventListener,
            blur: this._handleBlur.bind(this) as EventListener,
            keydown: this._handleKeyDown.bind(this) as EventListener,
        };
    }

    private _handleKeyDown(e: KeyboardEvent) {
        const keyHandlers = {
            [KEYS.ENTER]: this._handleEnter,
            [KEYS.SPACE]: this._handleSpace,
            [KEYS.ESC]: this._handleEsc,
            [KEYS.UP]: this._handleUp,
            [KEYS.DOWN]: this._handleDown,
            [KEYS.TAB]: this._handleTab,
        };

        const handler = keyHandlers[e.code]?.bind(this);

        if (handler) {
            handler(e);
            return;
        }

        // Если нажата специальная клавиша и она не обработана отдельно выше - предотвратить ввод
        if (Object.values(KEYS).includes(e.code)) this._cancelKeyDown(e);
    }

    private _cancelKeyDown(e: KeyboardEvent) {
        e.stopImmediatePropagation();
        e.preventDefault();
    }

    private _handleEnter() {
        if (!(this._options.triggerSelectOnEnter ?? DEFAULT_TRIGGER_SELECT_ON_ENTER)) return;

        if (this._containerView.isVisible) {
            this._selectModel.chooseMatchingSuggestion(true);
        } else {
            this._triggerOnSelectNothing();
        }
    }

    private _handleSpace(e: KeyboardEvent) {
        const triggerSelectOnSpace =
            this._options.triggerSelectOnSpace ?? DEFAULT_TRIGGER_SELECT_ON_SPACE;

        if (!triggerSelectOnSpace || !this._view.isCursorAtEnd()) return;

        this._cancelKeyDown(e);
        this._selectModel.chooseAndContinue();
    }

    private _handleTab(e: KeyboardEvent) {
        if (this._options.tabDisabled ?? DEFAULT_TAB_DISABLED) this._cancelKeyDown(e);
    }

    private _handleEsc() {
        if (!this._provider) return;

        this._view.restoreLastSavedValue();
        this._containerView.hide();

        this._provider.abortSuggestionsRequest();
        this._provider.updateChosenSuggestionIndex(-1);
    }

    private _handleUp() {
        if (!this._containerView.isVisible) return;
        this._navigateModel.handleNavigate("up");
    }

    private _handleDown() {
        if (!this._provider) return;

        if (this._containerView.isVisible) {
            this._navigateModel.handleNavigate("down");
        } else {
            const suggestions = this._provider.getSuggestionsData(this._view.getValue());

            this._triggerRender({
                fetched: true,
                suggestions,
            });
        }
    }

    private async _handleFocus() {
        const isInputActive = document.activeElement === this._view.getEl();

        if (!this._provider || !isInputActive) return;

        this._view.updateSavedValue();

        const suggestionsData = await this._suggestModel.getSuggestionsIfAllowed();
        if (suggestionsData) {
            this._checkChoosenSuggestion(suggestionsData);
            this._triggerRender(suggestionsData);
        }

        if (!this._getIsMobile()) return;

        // для мобильных - установить курсор в конец
        // и проскроллить документ к инпуту (если разрешено в опциях)
        this._view.setCursorAtEnd();
        if (this._options.scrollOnFocus ?? DEFAULT_SCROLL_ON_FOCUS) {
            this._view.getEl().scrollIntoView({ behavior: "smooth" });
        }
    }

    private async _handleBlur() {
        // если виджет неактивен
        if (!this._provider) return;

        // сначала отменить текущий запрос подсказок, если все еще не завершен
        this._provider.abortSuggestionsRequest();

        if (this._options.triggerSelectOnBlur ?? DEFAULT_TRIGGER_SELECT_ON_BLUR) {
            await this._selectModel.chooseMatchingSuggestion();
        } else {
            // иначе просто скрыть список подсказок
            this._containerView.hide();
        }
    }

    private async _handleInput() {
        const suggestionsData = await this._suggestModel.handleInput();
        if (suggestionsData) this._triggerRender(suggestionsData);
    }

    // обновляет индекс выбранной подсказки в соответствии с новым списком подсказок
    // (если подсказка не найдена - будет -1)
    private _checkChoosenSuggestion(suggestionsData: SuggestionsData) {
        if (!suggestionsData.fetched || !this._provider || !this._provider.chosenSuggestion) return;

        const index = suggestionsData.suggestions.findIndex((s) =>
            areSame(this._provider?.chosenSuggestion, s.suggestion)
        );

        this._provider.updateChosenSuggestionIndex(index);
    }

    private _triggerRender(suggestionsData: SuggestionsData) {
        if (!suggestionsData?.fetched || !this._provider) return;

        const selected = this._provider.getSelection();
        const firstSuggestion = suggestionsData.suggestions[0]?.suggestion;

        // не выводить список подсказок, если в нем только одна текущая подсказка
        if (suggestionsData.suggestions.length === 1 && selected?.value === firstSuggestion.value) {
            return;
        }

        this._containerView.render({
            hint: this._provider.getSuggestionsHint(),
            noSuggestionsHint: this._provider.getNoSuggestionsHint(),
            suggestions: suggestionsData.suggestions,
            planName: this._provider.getStatus()?.planName || "",
            selectedIndex: this._provider.chosenSuggestionIndex,
            onClick: this._selectModel.chooseSuggestion.bind(this._selectModel),
            beforeRender: this._options.beforeRender,
            closeDelay: this._options.closeDelay,
        });
    }
}
