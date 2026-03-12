export default () => {
    const input = document.createElement("input");
    document.body.appendChild(input);

    return {
        input,
        setInputValue: (value: string) => {
            input.value = value;
            input.dispatchEvent(new InputEvent("input"));
        },
        triggerBlur: () => {
            input.dispatchEvent(new FocusEvent("blur"));
        },
        hitKeyDown: (code: string) => {
            const event = new KeyboardEvent("keydown", {
                code,
                cancelable: true,
                bubbles: true,
            });

            input.dispatchEvent(event);
            return event;
        },
    };
};
