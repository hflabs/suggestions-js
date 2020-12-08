/**
 * Create DOM elements and assign properties on it
 * @param {string} tagName
 * @param {object} props
 */
export const createElement = <Tag extends keyof HTMLElementTagNameMap>(
  tagName: Tag,
  props?: Partial<HTMLElementTagNameMap[Tag]>
): HTMLElementTagNameMap[Tag] => {
  const el = document.createElement(tagName);

  if (props) {
    Object.assign(el, props);
  }

  return el;
};
