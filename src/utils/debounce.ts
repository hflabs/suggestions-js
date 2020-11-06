interface Debounced<A extends unknown[]> {
  (...args: A): void;
  cancel: () => void;
}

export const debounce = <A extends unknown[]>(
  fn: (...args: A) => unknown,
  wait: number
): Debounced<A> => {
  let timer: number | null;
  let delayedArgs: A;

  const debounced = (...args: A) => {
    delayedArgs = args;
    if (timer) clearTimeout(timer);

    timer = window.setTimeout(() => {
      timer = null;
      fn(...delayedArgs);
    }, wait);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
    }
  };

  return debounced;
};
