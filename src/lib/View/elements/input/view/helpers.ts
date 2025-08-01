export type INPUT_LISTENERS = { [k: string]: EventListener };

const ATTRIBUTES = {
    autocomplete: "new-password",
    autocorrect: "off",
    autocapitalize: "off",
    spellcheck: "false",
};

/**
 * Устанавливает на переданный input атрибуты из списка ATTRIBUTES
 * Если для атрибута уже есть значение, сохраняет его в dataset
 */
export const setAttributes = (el: HTMLInputElement | HTMLTextAreaElement) => {
    Object.entries(ATTRIBUTES).forEach(([attribute, value]) => {
        const initialValue = el.getAttribute(attribute);

        if (initialValue) el.dataset[attribute] = initialValue;
        el.setAttribute(attribute, value);
    });
};

/**
 * Удаляет у переданного input атрибуты из списка ATTRIBUTES
 * или восстанавливает их изначальные значения из dataset
 */
export const restoreAttributes = (el: HTMLInputElement | HTMLTextAreaElement) => {
    Object.keys(ATTRIBUTES).forEach((key) => {
        if (el.dataset[key]) {
            el.setAttribute(key, el.dataset[key]);
        } else {
            el.removeAttribute(key);
        }
    });
};

// Добавляет обработчики событий на input
export const setListeners = (
    el: HTMLInputElement | HTMLTextAreaElement,
    listeners: INPUT_LISTENERS
) => {
    Object.entries(listeners).forEach(([eventName, listener]) =>
        el.addEventListener(eventName, listener)
    );
};

// Удаляет обработчики событий из input
export const removeListeners = (
    el: HTMLInputElement | HTMLTextAreaElement,
    listeners: INPUT_LISTENERS
) => {
    Object.entries(listeners).forEach(([eventName, listener]) =>
        el.removeEventListener(eventName, listener)
    );
};
