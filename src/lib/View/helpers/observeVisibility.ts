const isElementVisible = (element: HTMLInputElement) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && document.body.contains(element);
};

/**
 * Отслеживает видимость элемента в DOM, выполняет коллбэк при изменениях
 * Возвращает функцию для отписки
 *
 * Видимость элемента определяется наличием размеров
 * -- если элемент скрыт через opacity или другими подобными методами, он будет видимым
 */
export const observeVisibility = (
    element: HTMLInputElement,
    callback: (isVisible: boolean, disconnect: () => void) => void
) => {
    if (!element || !(element instanceof HTMLInputElement)) return () => {};

    const options = { root: document.documentElement };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            callback(entry.intersectionRatio > 0, () => observer.disconnect());
        });
    }, options);

    if (isElementVisible(element)) {
        callback(true, () => observer.disconnect());
    } else {
        observer.observe(element);
    }

    return () => observer.disconnect();
};
