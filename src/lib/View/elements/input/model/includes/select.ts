import type { Provider } from "@/lib/Provider";
import { BaseInputModel } from "./base";

type SelectionData = Awaited<ReturnType<Provider["selectSuggestionByIndex"]>>;

/**
 * Класс, поставляющий методы для выбора подсказки из списка подсказок.
 */
export class InputSelectModel extends BaseInputModel {
    async chooseSuggestion(suggestionIndex: number) {
        if (!this._canChooseSuggestion || !this._provider) return;

        this._canChooseSuggestion = false; // стартовать процесс выбора подсказки
        const lastValue = this._view.getValue();

        // выбрать подсказку по индексу
        const result = await this._provider.selectSuggestionByIndex(suggestionIndex, lastValue);

        this._view.triggerFocus();
        this._handleSelection(result, lastValue, true);

        if (result.selected && result.suggestionValue) this._containerView.hide();
        this._canChooseSuggestion = true;
    }

    async chooseMatchingSuggestion(addSpace?: boolean) {
        if (!this._provider) return;

        const hasSuggestions = await this._hasSuggestionsToChoose();
        if (!hasSuggestions) {
            this._containerView.hide();
            return;
        }

        this._canChooseSuggestion = false;
        const lastValue = this._view.getValue();

        // выбрать подходящую подсказку по текущему значению инпута
        const result = await this._provider.selectMatchingSuggestion(lastValue);
        this._provider.abortSuggestionsRequest();

        this._handleSelection(result, lastValue, addSpace);

        this._containerView.hide();
        this._canChooseSuggestion = true;
    }

    async chooseAndContinue() {
        const hasSuggestions = await this._hasSuggestionsToChoose();
        if (!hasSuggestions || !this._provider) return;

        this._canChooseSuggestion = false;
        const lastValue = this._view.getValue();

        // выбрать подходящую подсказку по текущему значению инпута
        const result = await this._provider.selectMatchingSuggestion(lastValue, false);
        this._provider.abortSuggestionsRequest();

        this._handleSelection(result, lastValue, true);

        this._provider.updateChosenSuggestionIndex(-1);
        this._canChooseSuggestion = true;
    }

    async triggerFixData(query: string) {
        if (!this._canChooseSuggestion || !this._provider) return;

        this._canChooseSuggestion = false; // стартовать процесс выбора подсказки
        const lastValue = this._view.getValue();

        const result = await this._provider.fixData(query);

        if (result.selected) this._handleSelection(result, lastValue, true);
        this._triggerFixData(result.selected);

        this._containerView.hide();
        this._canChooseSuggestion = true;
    }

    private _handleSelection(selection: SelectionData, lastValue: string, addSpace?: boolean) {
        let valueToUse = selection.suggestionValue || "";
        if (valueToUse && addSpace && !selection.isFinal) valueToUse += " ";

        if (selection.selected) this._view.setValue(valueToUse);

        if (!selection.selected || !valueToUse) {
            this._triggerOnSelectNothing();
        } else {
            this._triggerOnSelect(selection.areSuggestionsSame, valueToUse !== lastValue);
        }
    }

    private async _hasSuggestionsToChoose() {
        if (!this._canChooseSuggestion || !this._provider) return false;

        // принудительно завершить таймер, если еще не закончился
        this._inputDelayTimer.clearTimer();
        await this._inputDelayTimer.resolve();

        const suggestionsData = await this._provider.suggestionsFetchPromise;

        // подсказку можно выбирать, если они получены и нет уже выбранной подсказки
        return Boolean(suggestionsData?.fetched && !this._provider.chosenSuggestion);
    }
}
