interface Debounced<A extends unknown[]> {
  (...args: A): void;
  cancel: () => void;
}

/**
 * Create debounced function.
 *
 * Sequent calls will be accumulated and `fn` will be called `wait` ms after the last call.
 * Debounced function has `cancel` method for canceling a waiting call of `fn`.
 *
 * @param {Function} fn
 * @param {number} wait
 */
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
