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
import { invoke } from "../../utils/invoke";

export interface ImplementationBaseOptions<SuggestionData>
  extends InnerInitOptions<SuggestionData> {
  api: Api<SuggestionData>;
  input: Input;
  plan?: StatusPlan;
}

export interface ImplementationBaseConstructor<SuggestionData> {
  new (
    el: HTMLInputElement,
    options: ImplementationBaseOptions<SuggestionData>
  ): ImplementationBase<SuggestionData>;
}

abstract class ImplementationBase<SuggestionData> extends Disposable {
  protected fetchSuggestionApiMethod: RequestSuggestionsMethod = "findById";
  private currentSuggestion: Suggestion<SuggestionData> | null = null;

  constructor(
    protected el: HTMLInputElement,
    protected options: ImplementationBaseOptions<SuggestionData>
  ) {
    super();
  }

  /**
   * Restores suggestion object for current input's value.
   */
  public fixData(): Promise<Suggestion<SuggestionData> | null> {
    const { input } = this.options;
    const query = input.getValue().trim();

    return new Promise<Suggestion<SuggestionData> | null>((resolve, reject) => {
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
  protected setCurrentSuggestion(
    suggestion: Suggestion<SuggestionData> | null
  ): void {
    const {
      input,
      onInvalidateSelection,
      onSelect,
      onSelectNothing,
    } = this.options;

    if (suggestion) {
      if (!deepEqual(suggestion, this.currentSuggestion)) {
        invoke(onSelect, suggestion, true, this.el);
      }
    } else {
      if (this.currentSuggestion) {
        invoke(onInvalidateSelection, this.currentSuggestion, this.el);
      } else {
        invoke(onSelectNothing, input.getValue(), this.el);
      }
    }

    this.currentSuggestion = suggestion;
  }

  protected getCurrentSuggestion(): Suggestion<SuggestionData> | null {
    return this.currentSuggestion;
  }

  /**
   * Fetch one suggestion. Used for enriching and within fixData.
   * In contrast with fetchSuggestions, no cache and no onSearch... callbacks triggered.
   */
  protected fetchSuggestion(
    query: string,
    params?: Record<string, unknown>
  ): Promise<Suggestion<SuggestionData> | null> {
    const { api } = this.options;

    return api
      .fetchSuggestions(this.fetchSuggestionApiMethod, query, {
        ...params,
        count: 1,
      })
      .then((suggestions) => suggestions[0] || null);
  }

  protected triggeringSearchCallbacks<
    Result extends
      | Suggestions<SuggestionData>
      | Suggestion<SuggestionData>
      | null
  >(
    fn: (
      this: ImplementationBase<SuggestionData>,
      query: string,
      params?: Record<string, unknown>
    ) => Promise<Result>
  ): (query: string, params?: Record<string, unknown>) => Promise<Result> {
    const { onSearchError, onSearchStart, onSearchComplete } = this.options;

    return (query: string, params?: Record<string, unknown>) => {
      const searchStartResult = invoke(onSearchStart, query, this.el);
      const adjustedQuery = isString(searchStartResult)
        ? searchStartResult
        : query;

      const request = fn.call(this, adjustedQuery, params);

      request.then(
        (result) => {
          invoke(
            onSearchComplete,
            result instanceof Array
              ? result
              : result
              ? [result as Suggestion<SuggestionData>]
              : [],
            adjustedQuery,
            this.el
          );
        },
        (error) => {
          if (error.message !== ERROR_FETCH_ABORTED) {
            invoke(onSearchError, error, adjustedQuery, this.el);
          }
        }
      );

      return request;
    };
  }
}

export default ImplementationBase;
