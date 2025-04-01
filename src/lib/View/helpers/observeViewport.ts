/**
 * Отслеживает изменение вьюпорта по заданному селектору, выполняет коллбэк при изменениях
 * Возвращает функцию для отписки
 */
export const observeViewport = (mobileWidth: number, onChange: (isMobile: boolean) => void) => {
    const mql = window.matchMedia(`(max-width: ${mobileWidth}px)`);

    onChange(mql.matches);

    const handleChange = (e: MediaQueryListEvent) => {
        onChange(e.matches);
    };

    mql.addEventListener("change", handleChange);

    onChange(mql.matches);

    return () => {
        mql.removeEventListener("change", handleChange);
    };
};
