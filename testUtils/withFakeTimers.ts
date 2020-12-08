export const withFakeTimers = (
  fn: () => Promise<void> | void
): Promise<void> | void => {
  jest.useFakeTimers();
  const cleanup = () => {
    jest.useRealTimers();
  };
  const result = fn();

  if (result instanceof Promise) return result.finally(cleanup);

  cleanup();
  return result;
};
