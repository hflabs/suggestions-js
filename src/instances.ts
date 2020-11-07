/**
 * Module manages instances of `Suggestions` class. Used by entry-points.
 *
 * Provides functions for creating, disposing instances, as well as invoking public methods on them.
 */

import Suggestions from "./classes/Suggestions";
import ImplementationBase, {
  ImplementationBaseConstructor,
} from "./classes/Implementations/ImplementationBase";
import { InitOptions, PickMethods } from "./types";
import { defaultOptions } from "./defaultOption";

/**
 * Global store for created Suggestions instances
 */
export const instances = new (WeakMap || Map)<
  HTMLInputElement,
  Suggestions<unknown, ImplementationBase<unknown>>
>();

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
    throw new Error('Option "type" is required.');
  }

  instances.get(el)?.dispose();

  const instance = new Suggestions<D, ImplementationBase<D>>(
    el,
    ImplementationClass,
    {
      ...defaultOptions,
      ...options,
    } as InitOptions<D>
  );

  instances.set(
    el,
    instance as Suggestions<unknown, ImplementationBase<unknown>>
  );

  return () => instances.delete(el);
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
  M extends keyof PickMethods<I> = keyof PickMethods<I>
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
    : Promise.reject(
        new Error("Suggestions are not instantiated on this element.")
      );
};
