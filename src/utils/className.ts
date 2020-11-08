/**
 * Functions for setting className on DOM Elements
 */

import { isString } from "./isString";
import { escapeHtml } from "./escape";

/**
 * Keep only strings
 */
const filterClasses = (classes: unknown[]): string[] =>
  classes
    .filter(isString)
    .reduce((memo, cls) => [...memo, ...cls.split(/\s+/g)], [] as string[]);

export const addClass = (el: Element, ...classes: unknown[]): void =>
  // iterate, because classList.add does not support multiple arguments in IE
  filterClasses(classes).forEach((cls) => el.classList.add(cls));

export const removeClass = (el: Element, ...classes: unknown[]): void =>
  // iterate, because classList.remove does not support multiple arguments in IE
  filterClasses(classes).forEach((cls) => el.classList.remove(cls));

/**
 * Returns html-safe string, that can be passed to innerHTML
 */
export const toClassName = (...classes: unknown[]): string =>
  filterClasses(classes).map(escapeHtml).join(" ");
