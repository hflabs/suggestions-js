/**
 * Module to be built as `@dadata/suggestions/findById.js`.
 *
 * This is a basic mode, it supports fetching suggestions from backend and passing them to callbacks.
 */

import { FunctionPropertyNames, InitOptions } from "../types";
import ImplementationFindById from "../classes/Implementations/ImplementationFindById";
import {
  disposeInstance,
  execInstanceMethod,
  initInstance,
} from "../instances";

/**
 * Initialize "findById" Suggestions functionality on <input> element
 *
 * @param {HTMLInputElement} el
 * @param {Partial<InitOptions>} options
 */
export const init = <SuggestionData = unknown>(
  el: HTMLInputElement,
  options: Partial<InitOptions<SuggestionData>>
): (() => void) =>
  initInstance<SuggestionData>(el, options, ImplementationFindById);

/**
 * Invokes some public method of implementation
 *
 * @param {HTMLInputElement} el
 * @param {string} method
 * @param {any[]} args
 */
export const execMethod = <
  SuggestionData,
  Methods extends FunctionPropertyNames<ImplementationFindById<SuggestionData>>
>(
  el: HTMLInputElement,
  method: Methods,
  ...args: Parameters<ImplementationFindById<SuggestionData>[Methods]>
): Promise<ReturnType<ImplementationFindById<SuggestionData>[Methods]>> =>
  execInstanceMethod<
    SuggestionData,
    ImplementationFindById<SuggestionData>,
    Methods
  >(el, method, ...args);

/**
 * Removes Suggestions functionality from the input element
 * @param {HTMLInputElement} el
 */
export const dispose = disposeInstance;
