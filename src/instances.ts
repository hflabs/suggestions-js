/**
 * Module manages instances of `Suggestions` class. Used by entry-points.
 *
 * Provides functions for creating, disposing instances, as well as invoking public methods on them.
 */

import Suggestions from "./classes/Suggestions";
import ImplementationBase, {
  ImplementationBaseConstructor,
} from "./classes/Implementations/ImplementationBase";
import {
  FunctionPropertyNames,
  InitOptions,
  InnerInitFunctionalOptionNames,
} from "./types";
import { defaultCallbackOptions, defaultOptions } from "./defaultOption";
import { ERROR_NOT_INITIALIZED, ERROR_OPTION_TYPE_IS_REQUIRED } from "./errors";

export const createInstancesStore = <K extends Element, V>():
  | WeakMap<K, V>
  | Map<K, V> => new (WeakMap || Map)<K, V>();

/**
 * Global store for created Suggestions instances
 */
export const instances = createInstancesStore<
  HTMLInputElement,
  Suggestions<unknown, ImplementationBase<unknown>>
>();

// Type-guarding to forbid non-functional values to functional props
export const clearFunctionOptions = <D>(
  options: Partial<InitOptions<D>>
): Partial<InitOptions<D>> =>
  Object.keys(defaultCallbackOptions).reduce((memo, name) => {
    const value = memo[name as InnerInitFunctionalOptionNames];
    return typeof value === "function"
      ? memo
      : {
          ...memo,
          [name]:
            defaultCallbackOptions[name as InnerInitFunctionalOptionNames],
        };
  }, options);

/**
 * Removes Suggestions functionality from the input element
 * @param el
 */
export const disposeInstance = (el: HTMLInputElement): void => {
  instances.get(el)?.dispose();
  instances.delete(el);
};

/**
 * Factory to produce Suggestions instances
 *
 * @param el
 * @param ImplementationClass
 * @param options
 * @return {Function} callback for disposing an instance
 */
export const initInstance = <D = unknown>(
  el: HTMLInputElement,
  options: Partial<InitOptions<D>>,
  ImplementationClass: ImplementationBaseConstructor<D>
): (() => void) => {
  if (!options?.type) {
    throw new Error(ERROR_OPTION_TYPE_IS_REQUIRED);
  }

  instances.get(el)?.dispose();

  const instance = new Suggestions<D, ImplementationBase<D>>(
    el,
    ImplementationClass,
    {
      ...defaultOptions,
      ...clearFunctionOptions<D>(options),
    } as InitOptions<D>
  );

  instances.set(
    el,
    instance as Suggestions<unknown, ImplementationBase<unknown>>
  );

  return () => disposeInstance(el);
};

/**
 * Invokes some public method of implementation
 *
 * @param {HTMLInputElement} el
 * @param {string} method
 * @param {any[]} args
 */
export const execInstanceMethod = <
  D,
  I extends ImplementationBase<D>,
  M extends FunctionPropertyNames<I> = FunctionPropertyNames<I>
>(
  el: HTMLInputElement,
  method: M,
  ...args: Parameters<I[M]>
): Promise<ReturnType<I[M]>> => {
  const instance = instances.get(el);

  return instance
    ? ((instance as unknown) as Suggestions<D, I>).invokeImplementationMethod<
        M
      >(method, ...args)
    : Promise.reject(new Error(ERROR_NOT_INITIALIZED));
};
