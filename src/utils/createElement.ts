export const createElement = <T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  props?: Partial<HTMLElementTagNameMap[T]>
): HTMLElementTagNameMap[T] => {
  const el = document.createElement(tagName);

  if (props) {
    Object.assign(el, props);
  }

  return el;
};
