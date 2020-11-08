export const isCursorAtEnd = (
  el: HTMLInputElement,
  fallback: boolean
): boolean => {
  if (el !== document.activeElement) return false;

  // `selectionStart` and `selectionEnd` are not supported by some input types
  try {
    const selectionStart = el.selectionStart;

    if (typeof selectionStart === "number") {
      const length = el.value.length;
      return selectionStart === length;
    }
  } catch (ex) {
    // Continue with fallback
  }

  return fallback;
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
