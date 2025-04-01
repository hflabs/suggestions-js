import { BaseInputModel } from "./base";

/**
 * Класс, поставляющий метод для обработки навигации по списку подсказок стрелками клавиатуры.
 */
export class InputNavigateModel extends BaseInputModel {
    async handleNavigate(type: "up" | "down") {
        if (!this._canChooseSuggestion || !this._provider) return;
        const nextIndex = this._getNextIndex(type);

        if (nextIndex === null) {
            // нельзя двигаться дальше - вернуться к исходному состоянию, не закрывая контейнер с подсказками
            this._provider.updateChosenSuggestionIndex(-1);
            this._containerView.updateSelected(-1);
            this._view.restoreLastSavedValue();
            return;
        }

        // выбрать подсказку по новому индексу
        // (визуально и в chosenSuggestionIndex) и обновить значение инпута
        const suggestionToChoose = this._provider.getSuggestions()[nextIndex];

        this._provider.updateChosenSuggestionIndex(nextIndex);
        this._containerView.updateSelected(nextIndex);
        this._view.setTemporalValue(suggestionToChoose.value || "");
    }

    private _getNextIndex(type: "up" | "down") {
        if (!this._provider) return null;
        const suggestionsQty = this._provider.getSuggestions().length;

        const lastSuggestionIndex = suggestionsQty - 1;
        const { chosenSuggestionIndex } = this._provider;

        if (type === "down") {
            return chosenSuggestionIndex === lastSuggestionIndex ? null : chosenSuggestionIndex + 1;
        }

        if (chosenSuggestionIndex === 0 || (chosenSuggestionIndex === -1 && !suggestionsQty)) {
            return null;
        }

        return chosenSuggestionIndex !== -1 ? chosenSuggestionIndex - 1 : lastSuggestionIndex;
    }
}
