/**
 * Module to be built as `@dadata/suggestions/suggest.js`.
 *
 * It is a default module of the package. Allows selecting suggestions in a dropdown.
 */

import { FunctionPropertyNames, InitOptions } from "../types";
import {
  disposeInstance,
  execInstanceMethod,
  initInstance,
} from "../instances";
import ImplementationSuggest from "../classes/Implementations/ImplementationSuggest";

/**
 * Initialize "suggest" Suggestions functionality on <input> element
 *
 * @param {HTMLInputElement} el
 * @param {Partial<InitOptions>} options
 */
export const init = <SuggestionDataType = unknown>(
  el: HTMLInputElement,
  options: Partial<InitOptions<SuggestionDataType>> &
    Pick<InitOptions<SuggestionDataType>, "type">
): (() => void) => initInstance(el, options, ImplementationSuggest);

/**
 * Invokes some public method of implementation
 *
 * @param {HTMLInputElement} el
 * @param {string} method
 * @param {any[]} args
 */
export const execMethod = <
  SuggestionDataType,
  Methods extends FunctionPropertyNames<
    ImplementationSuggest<SuggestionDataType>
  >
>(
  el: HTMLInputElement,
  method: Methods,
  ...args: Parameters<ImplementationSuggest<SuggestionDataType>[Methods]>
): Promise<ReturnType<ImplementationSuggest<SuggestionDataType>[Methods]>> =>
  execInstanceMethod<
    SuggestionDataType,
    ImplementationSuggest<SuggestionDataType>,
    Methods
  >(el, method, ...args);

/**
 * Removes Suggestions functionality from the input element
 * @param {HTMLInputElement} el
 */
export const dispose = disposeInstance;
