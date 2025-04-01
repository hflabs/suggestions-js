import { DEFER_REQUEST_DEFAULT } from "@view/view.constants";

import { BaseInputModel } from "./base";

/**
 * Класс, поставляющий методы для запроса подсказок по значению элемента
 */
export class InputSuggestModel extends BaseInputModel {
    async handleInput() {
        if (!this._provider) return;
        // Отменить прыдущий запрос
        this._provider.abortSuggestionsRequest();

        // Отложить выполнение на requestTimeout ms
        this._inputDelayTimer.clearTimer();
        this._inputDelayTimer.reject();

        const timerResult = await this._inputDelayTimer.startTimer(
            this._options.deferRequestBy ?? DEFER_REQUEST_DEFAULT
        );

        // Если после ожидания таймер был отменен или виджет стал неактивен - не продолжать
        if (timerResult !== "resolved" || !this._provider) return;

        // Если есть выбранная подсказка - инвалидировать ее перед запросом нового списка подсказок
        this._triggerInvalidate();

        return await this.getSuggestionsIfAllowed();
    }

    async getSuggestionsIfAllowed() {
        if (!this._provider) return;

        if (!this._provider.canProcessQuery(this._view.getValue())) {
            this._containerView.hide();
            return;
        }

        return await this._provider.fetchSuggestions(this._view.getValue());
    }
}
