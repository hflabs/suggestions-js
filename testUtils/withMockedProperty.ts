export const withMockedProperty = <T extends unknown>(
  target: T,
  property: keyof T,
  value: unknown,
  fn: () => Promise<void> | void
): Promise<void> | void => {
  const originalValue = target[property];

  // Allow to set whatever
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  target[property] = value;

  const cleanup = () => {
    target[property] = originalValue;
  };
  const result = fn();

  if (result instanceof Promise) return result.finally(cleanup);

  cleanup();
  return result;
};
