import { withMockedProperty } from "./withMockedProperty";

export const withElementMoved = (
  el: Element,
  fn: () => Promise<void> | void
): Promise<void> | void => {
  const { getBoundingClientRect } = el;

  return withMockedProperty(
    el,
    "getBoundingClientRect",
    () => {
      const rect = getBoundingClientRect.call(el);
      return { ...rect, top: rect.top + 1, y: rect.y + 1 };
    },
    fn
  );
};
