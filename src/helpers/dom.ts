interface ICreateElement<T extends keyof HTMLElementTagNameMap> {
    tagName: T;
    attributes?: Partial<HTMLElementTagNameMap[T]>;
    content?: string;
}

/**
 * Создает HTMLElement, опционально устанавливает его атрибуты и innerHTML
 * @param options опции для создания элемента
 * @param options.tagName - тэг элемента для создания
 * @param  options.attributes - HTML-атрибуты элемента (опционально)
 * @param  options.content - контент (innerHTML) элемента (опционально)
 * @returns HTMLElement
 */
export const createElement = <T extends keyof HTMLElementTagNameMap>(
    options: ICreateElement<T>
) => {
    const element = document.createElement(options.tagName);
    const { dataset, ...attributes } = options.attributes || {};

    Object.assign(element, attributes);

    Object.entries(dataset || {}).forEach(([key, value]) => {
        element.dataset[key] = value;
    });

    element.innerHTML = options.content || "";

    return element;
};
