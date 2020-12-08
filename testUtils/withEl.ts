export const withEl = (
  fn: (el: HTMLInputElement) => Promise<void> | void
): Promise<void> | void => {
  const el: HTMLInputElement = document.body.appendChild(
    document.createElement("input")
  );
  const cleanup = () => document.body.removeChild(el);
  const result = fn(el);

  if (result instanceof Promise) return result.finally(cleanup);

  cleanup();
  return result;
};
