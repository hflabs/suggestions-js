export const withEl = async (
  fn: (el: HTMLInputElement) => Promise<void> | void
): Promise<void> => {
  const el: HTMLInputElement = document.body.appendChild(
    document.createElement("input")
  );
  await fn(el);
  document.body.removeChild(el);
};
