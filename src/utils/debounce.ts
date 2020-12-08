interface Debounced<Args extends unknown[]> {
  (...args: Args): void;
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
export const debounce = <Args extends unknown[]>(
  fn: (...args: Args) => unknown,
  wait: number
): Debounced<Args> => {
  let timer: number | null;
  let delayedArgs: Args;

  const debounced = (...args: Args) => {
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
