interface Throttled<A extends unknown[]> {
  (...args: A): void;
  cancel: () => void;
}

export const throttle = <A extends unknown[]>(
  fn: (...args: A) => unknown,
  wait: number
): Throttled<A> => {
  let timer: number | null;
  let delayedArgs: A | null = null;

  const throttled = (...args: A) => {
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
