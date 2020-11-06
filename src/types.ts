import { ParsedUrlQueryInput } from "querystring";
import ImplementationBase from "./RequestModes/ImplementationBase";

export type TApiType = "ADDRESS" | "NAME" | "PARTY" | "EMAIL" | "BANK";
export type TApiRequestMode<D> = "suggest" | "findById" | ImplementationBase<D>;

export interface IImplementationOptions<D> {
  autoHighlightFirst: boolean;
  classNames?: {
    input?: string;
    popover?: string;
    hint?: string;
    item?: string;
  };
  count: number;
  deferRequestBy: number;
  enrichmentEnabled: boolean;
  formatSelected?: (suggestion: ISuggestion<D>) => string;
  helperElements: Array<Element>;
  hint: string;
  isSuggestionDataComplete?: (suggestion: ISuggestion<D>) => boolean;
  isQueryRequestable?: (query: string) => boolean;
  language: "ru" | "en";
  minLength: number;
  mobileMaxWidth: number;
  noCache: boolean;
  noSuggestionsHint: string;
  onInvalidateSelection?: (suggestion: ISuggestion<D>) => void;
  onSearchComplete?: (
    query: string,
    suggestions: ISuggestions<D>,
    el: HTMLInputElement
  ) => void;
  onSearchError?: (
    error: Error,
    query: string | null,
    el: HTMLInputElement
  ) => void;
  onSearchStart?: (query: string, el: HTMLInputElement) => string | void;
  onSelect?: (
    suggestion: ISuggestion<D>,
    changed: boolean,
    el: HTMLInputElement
  ) => void;
  onSelectNothing?: (query: string, el: HTMLInputElement) => void;
  partner?: string;
  preventBadQueries: false;
  renderSuggestion?: (
    suggestion: ISuggestion<D>,
    query: string,
    options?: {
      suggestions: ISuggestions<D>;
      unformattableTokens?: string[];
    }
  ) => string;
  requestHeaders?: Record<string, string>;
  requestParamName: string;
  requestParams?: ParsedUrlQueryInput;
  requestTimeout: number;
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
  type: TApiType;
  unformattableTokens?: string[];
}

export interface IInitOptions<D>
  extends Omit<IImplementationOptions<D>, "helperElements"> {
  helperElements?: ArrayLike<Element>;
  requestMode: TApiRequestMode<D>;
}

export interface ISuggestion<D> {
  value: string;
  unrestricted_value: string;
  data: D;
}

export type ISuggestions<D> = ISuggestion<D>[];
