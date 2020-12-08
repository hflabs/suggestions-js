export const invoke = <Args extends unknown[], Result extends unknown>(
  fn: ((...args: Args) => Result) | unknown,
  ...args: Args
): Result | void => {
  if (typeof fn === "function") return fn(...args);
};
