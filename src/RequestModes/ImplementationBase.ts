import Disposable from "../Disposable";
import { IImplementationOptions, ISuggestion } from "../types";
import Api, { TApiStatusPlan } from "../Api/Api";
import Input from "../Input/Input";
import { areSuggestionsSame } from "../utils/suggestion";

export interface IRequestModePublicMethods<D = unknown> {
  fixData: (
    resolve: (suggestion: ISuggestion<D> | null) => void,
    reject: (error: Error) => void
  ) => void;
}

export type TPublicMethodCall = ValueOf<
  {
    [M in keyof IRequestModePublicMethods]: [
      M,
      ...Parameters<IRequestModePublicMethods[M]>
    ];
  }
>;

export interface IImplementationBaseOptions<D>
  extends IImplementationOptions<D> {
  api: Api<D>;
  input: Input;
  plan?: TApiStatusPlan;
  publicCalls: TPublicMethodCall[];
}

export default class ImplementationBase<D>
  extends Disposable
  implements IRequestModePublicMethods {
  protected fetchSuggestionApiMethod: "suggest" | "findById" = "findById";
  protected suggestion: ISuggestion<D> | null = null;

  constructor(
    protected el: HTMLInputElement,
    protected options: IImplementationBaseOptions<D>
  ) {
    super();
    this.connectPublicCalls();
  }

  /**
   * Restores suggestion object for current input's value.
   */
  public fixData(
    resolve: (suggestion: ISuggestion<D> | null) => void,
    reject: (error: Error) => void
  ): void {
    const { input, onSelect } = this.options;
    const trimmedQuery = input.getValue().trim();

    if (this.isQueryRequestable(trimmedQuery)) {
      this.fetchSuggestion(trimmedQuery).then((suggestion) => {
        if (suggestion) {
          input.setValue(suggestion.value);
          onSelect?.(suggestion, false, this.el);
        } else {
          input.setValue("");
        }

        this.suggestion = suggestion;
        resolve(suggestion);
      }, reject);
    }

    this.onDispose(() =>
      reject(
        new Error("Suggestions has been disposed while data was been fetched")
      )
    );
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
  protected setSuggestion(suggestion: ISuggestion<D> | null): void {
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
  ): Promise<ISuggestion<D> | null> {
    const { api } = this.options;

    return api[this.fetchSuggestionApiMethod](query, {
      ...params,
      count: 1,
    }).then((suggestions) => suggestions[0] || null);
  }

  private connectPublicCalls() {
    const { publicCalls } = this.options;
    const invokePublicCall = ([method, ...args]: TPublicMethodCall) => {
      if (typeof this[method] === "function") {
        this[method](...args);
      }
      // Return a number to satisfy Array.push signature
      return 0;
    };

    publicCalls.forEach(invokePublicCall);
    publicCalls.push = invokePublicCall;
  }
}
