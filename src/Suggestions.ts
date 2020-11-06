import {
  IImplementationOptions,
  IInitOptions,
  ISuggestion,
  TApiRequestMode,
  TApiType,
} from "./types";
import Input, { EVENT_INPUT_VISIBLE } from "./Input/Input";
import Disposable from "./Disposable";
import ImplementationFindById from "./RequestModes/ImplementationFindById";
import Api, { IApiStatus } from "./Api/Api";
import { noop } from "./utils/noop";
import ImplementationSuggest from "./RequestModes/ImplementationSuggest";
import { TPublicMethodCall } from "./RequestModes/ImplementationBase";

type ImplementationMethodKeys = keyof PickMethods<
  Required<IImplementationOptions<unknown>>
>;

// Non-functional values will be replaced by these values
// This fixes cases like { formatSelected: false, }
const defaultCallbackOptions: Record<ImplementationMethodKeys, unknown> = {
  formatSelected: null,
  isQueryRequestable: null,
  isSuggestionDataComplete: null,
  onInvalidateSelection: null,
  onSearchComplete: null,
  onSearchError: null,
  onSearchStart: null,
  onSelect: null,
  onSelectNothing: null,
  renderSuggestion: null,
};

const getRequestModeClass = <D>(mode: TApiRequestMode<D>) => {
  if (typeof mode === "function") return mode;
  switch (mode) {
    case "suggest":
      return ImplementationSuggest;
    case "findById":
      return ImplementationFindById;
    default:
      throw new Error("`requestMode` option is incorrect");
  }
};

export default class Suggestions<
  D = Record<string, unknown>
> extends Disposable {
  static statusByType: Partial<Record<TApiType, IApiStatus>> = {};

  private api: Api<D> = new Api<D>(this.options);
  private input: Input = new Input(this.el, this.options);
  private publicCalls: TPublicMethodCall[] = [];

  constructor(private el: HTMLInputElement, private options: IInitOptions<D>) {
    super();
    this.onDispose(() => this.input.dispose());
    this.waitForInputIsVisible();
  }

  /**
   * Restores suggestion object for current input's value.
   * Returned promise resolves with suggestion or null if nothing matches current text.
   */
  public fixData(): Promise<ISuggestion<D> | null> {
    return new Promise<ISuggestion<D> | null>((resolve, reject) => {
      this.publicCalls.push(["fixData", resolve, reject]);
    });
  }

  /**
   * No need to initialize the main part of plugin's logic until the input is hidden
   * (e.g.: is on hidden tab with display:none)
   */
  private waitForInputIsVisible() {
    const handleInputIsVisible = () => {
      this.fetchStatus().then((status) => {
        const RequestModeClass = getRequestModeClass<D>(
          this.options.requestMode
        );

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const requestModeImplementation = new RequestModeClass<D>(this.el, {
          // Type-guarding to forbid pass non-functional values to functional props
          ...Object.keys(defaultCallbackOptions).reduce((memo, name) => {
            const value = memo[name as ImplementationMethodKeys];
            return typeof value === "function"
              ? memo
              : {
                  ...memo,
                  [name]:
                    defaultCallbackOptions[name as ImplementationMethodKeys],
                };
          }, this.options),
          helperElements: Array.prototype.slice.call(
            this.options.helperElements || []
          ),
          api: this.api,
          input: this.input,
          plan: status.plan,
          publicCalls: this.publicCalls,
        });

        this.onDispose(() => requestModeImplementation.dispose());
      }, noop);
    };

    this.el.addEventListener(EVENT_INPUT_VISIBLE, handleInputIsVisible);
    this.onDispose(() =>
      this.el.removeEventListener(EVENT_INPUT_VISIBLE, handleInputIsVisible)
    );
  }

  private fetchStatus(): Promise<IApiStatus> {
    const { type, onSearchError } = this.options;
    const alreadyFetched = Suggestions.statusByType[type];

    if (alreadyFetched) return Promise.resolve(alreadyFetched);

    const request = this.api.status();

    request.then(
      (status) => {
        Suggestions.statusByType[type] = status;
      },
      (error) => onSearchError?.(error, null, this.el)
    );

    return request;
  }
}
