import type { Provider } from "@/lib/Provider";
import type { PromisifiedTimer } from "@/lib/View/helpers/usePromisifiedTimer";
import type { PLUGIN_OPTIONS } from "@/lib/View/types";
import type { InputView } from "@/lib/View/elements/input/view/index";
import type { ContainerView } from "@/lib/View/elements/container/view/index";

import { usePromisifiedTimer } from "@/lib/View/helpers/usePromisifiedTimer";
import { triggerEvent } from "@/lib/View/helpers/triggerEvent";
import { ModelArgs } from "@view/elements/input/model/types";

/**
 * Базовый класс для подготовки методов обработки событий на элементе
 *
 * Инициализирует базовые опции, предоставляет методы для их обновления.
 * Предоставляет методы вызова основных событий на элементе.
 */
export class BaseInputModel {
    _view: InstanceType<typeof InputView>;
    _containerView: InstanceType<typeof ContainerView>;
    _canChooseSuggestion: boolean;
    _provider: InstanceType<typeof Provider> | undefined;
    _options: PLUGIN_OPTIONS;
    _inputDelayTimer: PromisifiedTimer;

    constructor(args: ModelArgs) {
        this._view = args.view;
        this._containerView = args.containerView;
        this._canChooseSuggestion = true;
        this._provider = args.provider;
        this._options = args.options;
        this._inputDelayTimer = usePromisifiedTimer();
    }

    updateOptions(options: ModelArgs["options"]) {
        this._options = options;
    }

    updateProvider(provider: ModelArgs["provider"]) {
        this._provider = provider;
    }

    _triggerOnSelectNothing() {
        if (!this._provider) return;

        if (typeof this._options.onSelectNothing === "function") {
            this._options.onSelectNothing(this._view.getValue());
        }

        triggerEvent({
            eventName: "suggestions-selectnothing",
            args: { query: this._view.getValue() },
            inputEl: this._view.getEl(),
        });
    }

    _triggerOnSelect(areSuggestionsSame: boolean, hasValueChanged: boolean) {
        if (!this._provider || areSuggestionsSame || !this._provider.chosenSuggestion) return;

        if (typeof this._options.onSelect === "function") {
            this._options.onSelect(this._provider.chosenSuggestion, hasValueChanged);
        }

        triggerEvent({
            eventName: "suggestions-select",
            args: {
                suggestion: this._provider.chosenSuggestion,
                suggestionChanged: hasValueChanged,
            },
            inputEl: this._view.getEl(),
        });
    }

    _triggerFixData() {
        if (!this._provider) return;

        triggerEvent({
            eventName: "suggestions-fixdata",
            args: { suggestion: this._provider.chosenSuggestion },
            inputEl: this._view.getEl(),
        });
    }

    _triggerInvalidate() {
        const { chosenSuggestion } = this._provider || {};
        if (!this._provider || !chosenSuggestion) return;

        this._provider.invalidateChosenSuggestion();

        if (typeof this._options.onInvalidateSelection === "function") {
            this._options.onInvalidateSelection(chosenSuggestion);
        }

        triggerEvent({
            eventName: "suggestions-invalidateselection",
            args: { suggestion: chosenSuggestion },
            inputEl: this._view.getEl(),
        });
    }
}
