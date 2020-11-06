const isString = (s: unknown): s is string => typeof s === "string";

/**
 * Omit falsy and unsafe items
 */
const filterClasses = (classes: (string | undefined | false)[]): string[] =>
  classes.filter(isString).filter((cls) => !/"'\s<>/.test(cls));

export const addClass = (
  el: Element,
  ...classes: (string | undefined | false)[]
): void =>
  // classList.add does not support multiple arguments in IE
  filterClasses(classes).forEach((cls) => el.classList.add(cls));

export const removeClass = (
  el: Element,
  ...classes: (string | undefined | false)[]
): void =>
  // classList.remove does not support multiple arguments in IE
  filterClasses(classes).forEach((cls) => el.classList.remove(cls));

export const toClassName = (
  ...classes: (string | undefined | false)[]
): string => filterClasses(classes).join(" ");
