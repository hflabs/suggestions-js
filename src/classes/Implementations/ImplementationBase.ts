import Disposable from "../Disposable";
import {
  InnerInitOptions,
  RequestSuggestionsMethod,
  StatusPlan,
  Suggestion,
  Suggestions,
} from "../../types";
import Api from "../Api";
import Input from "../Input";
import { deepEqual } from "../../utils/deepEqual";
import { isPositiveNumber } from "../../utils/isNumber";
import { isString } from "../../utils/isString";
import { ERROR_DISPOSED, ERROR_FETCH_ABORTED } from "../../errors";

export interface ImplementationBaseOptions<D> extends InnerInitOptions<D> {
  api: Api<D>;
  input: Input;
  plan?: StatusPlan;
}

export interface ImplementationBaseConstructor<D> {
  new (
    el: HTMLInputElement,
    options: ImplementationBaseOptions<D>
  ): ImplementationBase<D>;
}

abstract class ImplementationBase<D> extends Disposable {
  protected fetchSuggestionApiMethod: RequestSuggestionsMethod = "findById";
  private currentSuggestion: Suggestion<D> | null = null;

  constructor(
    protected el: HTMLInputElement,
    protected options: ImplementationBaseOptions<D>
  ) {
    super();
  }

  /**
   * Restores suggestion object for current input's value.
   */
  public fixData(): Promise<Suggestion<D> | null> {
    const { input } = this.options;
    const query = input.getValue().trim();

    return new Promise<Suggestion<D> | null>((resolve, reject) => {
      this.onDispose(() => reject(new Error(ERROR_DISPOSED)));

      Promise.resolve(
        this.isQueryRequestable(query)
          ? this.fetchSuggestion(query).then((suggestion) => {
              input.setValue(suggestion ? suggestion.value : "");
              return suggestion;
            })
          : null
      )
        .then((suggestion) => {
          this.setCurrentSuggestion(suggestion);
          resolve(suggestion);
        })
        .catch(reject);
    });
  }

  protected isQueryRequestable(query: string): boolean {
    const { isQueryRequestable, minLength } = this.options;

    if (isQueryRequestable) {
      return isQueryRequestable(query);
    }

    return !isPositiveNumber(minLength) || query.length >= minLength;
  }

  /**
   * Saves suggestion. Also triggers onSelect/onSelectNothing callbacks
   * @param suggestion
   * @protected
   */
  protected setCurrentSuggestion(suggestion: Suggestion<D> | null): void {
    const {
      input,
      onInvalidateSelection,
      onSelect,
      onSelectNothing,
    } = this.options;

    if (suggestion) {
      if (!deepEqual(suggestion, this.currentSuggestion)) {
        onSelect?.(suggestion, true, this.el);
      }
    } else {
      if (this.currentSuggestion) {
        onInvalidateSelection?.(this.currentSuggestion, this.el);
      } else {
        onSelectNothing?.(input.getValue(), this.el);
      }
    }

    this.currentSuggestion = suggestion;
  }

  protected getCurrentSuggestion(): Suggestion<D> | null {
    return this.currentSuggestion;
  }

  /**
   * Fetch one suggestion. Used for enriching and within fixData.
   * In contrast with fetchSuggestions, no cache and no onSearch... callbacks triggered.
   */
  protected fetchSuggestion(
    query: string,
    params?: Record<string, unknown>
  ): Promise<Suggestion<D> | null> {
    const { api } = this.options;

    return api
      .fetchSuggestions(this.fetchSuggestionApiMethod, query, {
        ...params,
        count: 1,
      })
      .then((suggestions) => suggestions[0] || null);
  }

  protected triggeringSearchCallbacks<
    R extends Suggestions<D> | Suggestion<D> | null
  >(
    fn: (
      this: ImplementationBase<D>,
      query: string,
      params?: Record<string, unknown>
    ) => Promise<R>
  ): (query: string, params?: Record<string, unknown>) => Promise<R> {
    const { onSearchError, onSearchStart, onSearchComplete } = this.options;

    return (query: string, params?: Record<string, unknown>) => {
      const searchStartResult = onSearchStart?.(query, this.el);
      const adjustedQuery = isString(searchStartResult)
        ? searchStartResult
        : query;

      const request = fn.call(this, adjustedQuery, params);

      request.then(
        (result) => {
          onSearchComplete?.(
            result instanceof Array
              ? result
              : result
              ? [result as Suggestion<D>]
              : [],
            adjustedQuery,
            this.el
          );
        },
        (error) => {
          if (error.message !== ERROR_FETCH_ABORTED) {
            onSearchError?.(error, adjustedQuery, this.el);
          }
        }
      );

      return request;
    };
  }
}

export default ImplementationBase;
