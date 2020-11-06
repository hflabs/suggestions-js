export const isCursorAtEnd = (el: HTMLInputElement): boolean => {
  const length = el.value.length;

  // `selectionStart` and `selectionEnd` are not supported by some input types
  try {
    const selectionStart = el.selectionStart;

    if (typeof selectionStart === "number") {
      return selectionStart === length;
    }
  } catch (ex) {}

  // Fallback for IE
  const { selection } = document as {
    selection?: {
      createRange: () => {
        moveStart: (unit: string, count: number) => void;
        text: string;
      };
    };
  };

  if (selection) {
    const range = selection.createRange();
    range.moveStart("character", -length);
    return length === range.text.length;
  }

  return true;
};

export const setCursorAtEnd = (el: HTMLInputElement): void => {
  const { value } = el;

  // `selectionStart` and `selectionEnd` are not supported by some input types
  try {
    el.selectionEnd = el.selectionStart = value.length;
    el.scrollLeft = el.scrollWidth;
  } catch (ex) {
    // Re-assigning a value puts cursor to the end
    el.value = value;
  }
};
