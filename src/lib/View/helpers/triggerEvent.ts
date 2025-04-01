interface IProps {
    eventName: string;
    inputEl: HTMLInputElement;
    args?: NonNullable<unknown>;
}

/**
 * Генерирует переданное событие на элементе инпута с переданными аргументами
 */
export const triggerEvent = ({ eventName, args, inputEl }: IProps) => {
    inputEl.dispatchEvent(new CustomEvent(eventName, args && { detail: args }));
};
