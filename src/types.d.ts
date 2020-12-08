/**
 * Core types used in plugin
 */

import { ParsedUrlQueryInput } from "querystring";

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
export type FunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export type InitType = "address" | "fio" | "party" | "email" | "bank" | string;

export type RequestSuggestionsMethod = "suggest" | "findById";

/**
 * Options used by inner classes
 */
export interface InnerInitOptions<D> {
  autoHighlightFirst: boolean;
  classNames?: {
    input?: string;
    popover?: string;
    hint?: string;
    list?: string;
    item?: string;
  };
  count: number;
  deferRequestBy: number;
  enrichmentEnabled: boolean;
  formatSelected?: (suggestion: Suggestion<D>) => string;
  helperElements?: Element[];
  hint: string;
  isSuggestionDataComplete?: (suggestion: Suggestion<D>) => boolean;
  isQueryRequestable?: (query: string) => boolean;
  language: "ru" | "en";
  minLength: number;
  mobileMaxWidth: number;
  noCache: boolean;
  noSuggestionsHint: string;
  onInvalidateSelection?: (
    suggestion: Suggestion<D>,
    el: HTMLInputElement
  ) => void;
  onSearchComplete?: (
    suggestions: Suggestions<D>,
    query: string,
    el: HTMLInputElement
  ) => void;
  onSearchError?: (
    error: Error,
    query: string | null,
    el: HTMLInputElement
  ) => void;
  onSearchStart?: (query: string, el: HTMLInputElement) => string | void;
  onSelect?: (
    suggestion: Suggestion<D>,
    changed: boolean,
    el: HTMLInputElement
  ) => void;
  onSelectNothing?: (query: string, el: HTMLInputElement) => void;
  partner?: string;
  preventBadQueries: boolean;
  renderSuggestion?: (
    suggestion: Suggestion<D>,
    query: string,
    options?: {
      suggestions: Suggestions<D>;
      unformattableTokens?: string[];
    }
  ) => string;
  requestHeaders?: Record<string, string>;
  requestParamName: string;
  requestParams?: ParsedUrlQueryInput;
  requestTimeout?: number;
  requestToken?: string;
  // url, который заменяет serviceUrl + method + type
  // то есть, если он задан, то для всех запросов будет использоваться именно он
  // если не поддерживается cors то к url будут добавлены параметры ?token=...&version=...
  // и заменен протокол на протокол текущей страницы
  requestUrl?: string;
  scrollOnFocus: boolean;
  // основной url, может быть переопределен
  serviceUrl: string;
  triggerSelectOnBlur: boolean;
  triggerSelectOnEnter: boolean;
  triggerSelectOnSpace: boolean;
  type: InitType;
  unformattableTokens?: string[];
}

/**
 * Options exposed for initializing
 */
export interface InitOptions<D>
  extends Omit<InnerInitOptions<D>, "helperElements"> {
  // Can be Array<Element> / NodeListOf<Element> / HTMLCollection<Element>
  helperElements?: ArrayLike<Element>;
}

export interface Suggestion<D> {
  value: string;
  unrestricted_value: string;
  data: D;
}

export type Suggestions<D> = Suggestion<D>[];

export type StatusPlan = "FREE" | string;

export interface Status {
  count: number;
  enrich: boolean;
  name: InitType;
  resources: { version: string; name: string }[];
  search: boolean;
  state: "ENABLED" | "DISABLED" | "INDEXING" | "REINDEXING";
  version: string;
  plan?: StatusPlan;
}
