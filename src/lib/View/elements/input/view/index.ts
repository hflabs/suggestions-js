import { CLASSES } from "@view/view.constants";
import type { INPUT_LISTENERS } from "./helpers";

import { removeListeners, setAttributes, restoreAttributes, setListeners } from "./helpers";

/**
 * Компонент-обертка над input элементом.
 *
 * Ничего не рендерит, навешивает обработчики, css-класс и атрибуты на оригинальный элемент.
 * Предоставляет вспомогательные методы
 */
export class InputView {
    private _el: HTMLInputElement | HTMLTextAreaElement;
    private _lastInputValue: string | null = null;
    private _prevHandledValue: string | null = null;
    private _currentListeners: INPUT_LISTENERS = {};

    constructor(el: HTMLInputElement | HTMLTextAreaElement) {
        this._el = el;
    }

    // Установить обработчики, атрибуты и класс
    init(listeners: INPUT_LISTENERS) {
        this._currentListeners = listeners;

        setAttributes(this._el);
        setListeners(this._el, this._currentListeners);

        this._el.classList.add(CLASSES.input);
    }

    // Метод для очистки. Удаляет добавленный класс, обработчики и атрибуты
    dispose() {
        restoreAttributes(this._el);
        removeListeners(this._el, this._currentListeners);

        this._el.classList.remove(CLASSES.input);
    }

    getValue() {
        return this._el.value;
    }

    // Обновить значение инпута вручную
    setValue(newValue: string) {
        this._lastInputValue = null;
        this._el.value = newValue;
        this.updateSavedValue();
        if (document.activeElement === this._el) this.setCursorAtEnd();
    }

    // Проверить, изменилось ли значение в инпуте
    isChanged() {
        return this._prevHandledValue !== this._el.value;
    }

    // Обновить сохраненное значение инпута
    updateSavedValue() {
        this._prevHandledValue = this._el.value;
    }

    // Получить последнее собственное значение инпута (исключая временные значения)
    getLastOwnValueValue() {
        return this._lastInputValue ?? this._el.value;
    }

    // Установить временное значение инпута, сохранив предыдущее значение
    setTemporalValue(newValue: string) {
        if (this._lastInputValue === null) this._lastInputValue = this._el.value;

        this._el.value = newValue;
        this.updateSavedValue();
        if (document.activeElement === this._el) this.setCursorAtEnd();
    }

    // Убрать "временное" значение, восстанавливает последнее сохраненное значение
    restoreLastSavedValue() {
        if (this._lastInputValue === null) return;
        this.setValue(this._lastInputValue);
    }

    getEl() {
        return this._el;
    }

    // Сфокусировать инпут без вызова обработчика
    triggerFocus() {
        const { focus: focusHandler } = this._currentListeners;

        if (focusHandler) this._el.removeEventListener("focus", focusHandler);
        this._el.focus();
        if (focusHandler) this._el.addEventListener("focus", focusHandler);
    }

    // Установить курсор в конец текста
    setCursorAtEnd() {
        setTimeout(() => {
            try {
                const { type } = this._el;

                if (!(this._el instanceof HTMLTextAreaElement) && type !== "text") {
                    this._el.type = "text";
                }

                this._el.setSelectionRange(-1, -1);

                if (!(this._el instanceof HTMLTextAreaElement) && type !== "text") {
                    this._el.type = type;
                }
            } catch {
                this._el.value = this.getValue();
            }
        });
    }

    isCursorAtEnd() {
        return this._el.selectionStart === this.getValue().length;
    }
}
