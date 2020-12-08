export interface Throttled<Args extends unknown[]> {
  (...args: Args): void;
  cancel: () => void;
}

export const throttle = <Args extends unknown[]>(
  fn: (...args: Args) => unknown,
  wait: number
): Throttled<Args> => {
  let timer: number | null;
  let delayedArgs: Args | null = null;

  const throttled = (...args: Args) => {
    if (timer) {
      delayedArgs = args;
    } else {
      timer = window.setTimeout(() => {
        timer = null;
        if (delayedArgs) fn(...delayedArgs);
        delayedArgs = null;
      }, wait);
      return fn(...args);
    }
  };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
    }
  };

  return throttled;
};
