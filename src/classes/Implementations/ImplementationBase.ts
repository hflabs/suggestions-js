import Disposable from "../Disposable";
import { InnerInitOptions, Suggestion, StatusPlan } from "../../types";
import Api, { ApiFetchSuggestionsMethods } from "../Api";
import Input from "../Input";
import { areSuggestionsSame } from "../../utils/suggestion";

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
  protected fetchSuggestionApiMethod: ApiFetchSuggestionsMethods = "findById";
  protected suggestion: Suggestion<D> | null = null;

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
    const { input, onSelect } = this.options;
    const trimmedQuery = input.getValue().trim();

    return new Promise<Suggestion<D> | null>((resolve, reject) => {
      this.onDispose(() =>
        reject(
          new Error("Suggestions has been disposed while data was been fetched")
        )
      );

      if (this.isQueryRequestable(trimmedQuery)) {
        this.fetchSuggestion(trimmedQuery).then((suggestion) => {
          if (suggestion) {
            input.setValue(suggestion.value);
            onSelect?.(suggestion, false, this.el);
          } else {
            input.setValue("");
          }

          this.suggestion = suggestion;
          reject(suggestion);
        }, reject);
      } else {
        resolve(null);
      }
    });
  }

  protected isQueryRequestable(query: string): boolean {
    const { isQueryRequestable } = this.options;

    if (isQueryRequestable) {
      return isQueryRequestable(query);
    }

    return query.length >= this.options.minLength;
  }

  /**
   * Saves suggestion. Also triggers onSelect/onSelectNothing callbacks
   * @param suggestion
   * @protected
   */
  protected setSuggestion(suggestion: Suggestion<D> | null): void {
    const {
      input,
      onInvalidateSelection,
      onSelect,
      onSelectNothing,
    } = this.options;

    if (suggestion) {
      if (!areSuggestionsSame(suggestion, this.suggestion)) {
        onSelect?.(suggestion, true, this.el);
      }
    } else {
      if (this.suggestion) {
        onInvalidateSelection?.(this.suggestion);
      } else {
        onSelectNothing?.(input.getValue(), this.el);
      }
    }

    this.suggestion = suggestion;
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
}

export default ImplementationBase;
