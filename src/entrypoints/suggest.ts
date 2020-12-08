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
export const init = <SuggestionData = unknown>(
  el: HTMLInputElement,
  options: Partial<InitOptions<SuggestionData>> &
    Pick<InitOptions<SuggestionData>, "type">
): (() => void) => initInstance(el, options, ImplementationSuggest);

/**
 * Invokes some public method of implementation
 *
 * @param {HTMLInputElement} el
 * @param {string} method
 * @param {any[]} args
 */
export const execMethod = <
  SuggestionData,
  Methods extends FunctionPropertyNames<ImplementationSuggest<SuggestionData>>
>(
  el: HTMLInputElement,
  method: Methods,
  ...args: Parameters<ImplementationSuggest<SuggestionData>[Methods]>
): Promise<ReturnType<ImplementationSuggest<SuggestionData>[Methods]>> =>
  execInstanceMethod<
    SuggestionData,
    ImplementationSuggest<SuggestionData>,
    Methods
  >(el, method, ...args);

/**
 * Removes Suggestions functionality from the input element
 * @param {HTMLInputElement} el
 */
export const dispose = disposeInstance;
