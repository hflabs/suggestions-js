/**
 * Module to be built as `@dadata/suggestions/findById.js`.
 *
 * This is a basic mode, it supports fetching suggestions from backend and passing them to callbacks.
 */

import { InitOptions, PickMethods } from "../types";
import ImplementationFindById from "../classes/Implementations/ImplementationFindById";
import { execInstanceMethod, initInstance } from "../instances";

/**
 * Initialize "findById" Suggestions functionality on <input> element
 *
 * @param {HTMLInputElement} el
 * @param {Partial<InitOptions>} options
 */
export const init = <D = unknown>(
  el: HTMLInputElement,
  options: Partial<InitOptions<D>>
): (() => void) => initInstance<D>(el, options, ImplementationFindById);

/**
 * Invokes some public method of implementation
 *
 * @param {HTMLInputElement} el
 * @param {string} method
 * @param {any[]} args
 */
export const execMethod = <
  SuggestionDataType,
  Methods extends keyof PickMethods<ImplementationFindById<SuggestionDataType>>
>(
  el: HTMLInputElement,
  method: Methods,
  ...args: Parameters<ImplementationFindById<SuggestionDataType>[Methods]>
): Promise<ReturnType<ImplementationFindById<SuggestionDataType>[Methods]>> =>
  execInstanceMethod<
    SuggestionDataType,
    ImplementationFindById<SuggestionDataType>,
    Methods
  >(el, method, ...args);
