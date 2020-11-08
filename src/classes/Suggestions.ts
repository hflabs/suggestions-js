import { FunctionPropertyNames, InitOptions, InitType, Status } from "../types";
import Input, { EVENT_INPUT_VISIBLE } from "./Input";
import Disposable from "./Disposable";
import Api from "./Api";
import { noop } from "../utils/noop";
import ImplementationBase, {
  ImplementationBaseConstructor,
} from "./Implementations/ImplementationBase";
import { ERROR_DISPOSED } from "../errors";

type PublicMethodCall<
  SuggestionData,
  Implementation extends ImplementationBase<SuggestionData>,
  Method extends FunctionPropertyNames<Implementation> = FunctionPropertyNames<
    Implementation
  >
> = [
  Method,
  Parameters<Implementation[Method]>,
  (result: ReturnType<Implementation[Method]>) => void,
  (error: Error) => void
];

export default class Suggestions<
  SuggestionData,
  Implementation extends ImplementationBase<SuggestionData>
> extends Disposable {
  private static statusByType: Partial<Record<InitType, Status>> = {};
  public static clearStatusCache = (): void => {
    Suggestions.statusByType = {};
  };

  private api: Api<SuggestionData> = new Api<SuggestionData>(this.options);
  private input: Input = new Input(this.el, this.options);
  private execCalls: PublicMethodCall<SuggestionData, Implementation>[] = [];
  private implementation?: Implementation;

  constructor(
    private el: HTMLInputElement,
    private ImplementationClass: ImplementationBaseConstructor<SuggestionData>,
    private options: InitOptions<SuggestionData>
  ) {
    super();
    this.onDispose(() => this.input.dispose());
    this.waitForInputIsVisible();
  }

  /**
   * Invoke public method of Implementation
   */
  public invokeImplementationMethod<
    A extends FunctionPropertyNames<Implementation>
  >(
    action: A,
    ...args: Parameters<Implementation[A]>
  ): Promise<ReturnType<Implementation[A]>> {
    return new Promise<ReturnType<Implementation[A]>>((resolve, reject) => {
      if (this.implementation) {
        resolve(this.implementation[action](...args));
      } else {
        this.execCalls.push([action, args, resolve, reject]);
        this.onDispose(() => {
          reject(new Error(ERROR_DISPOSED));
        });
      }
    });
  }

  /**
   * No need to initialize the main part of plugin's logic until the input is hidden
   * (e.g.: is on hidden tab with display:none)
   */
  private waitForInputIsVisible() {
    const handleInputIsVisible = () => {
      this.fetchStatus().then((status) => {
        this.implementation = this.initImplementation(status);
      }, noop);
    };

    this.el.addEventListener(EVENT_INPUT_VISIBLE, handleInputIsVisible);
    this.onDispose(() =>
      this.el.removeEventListener(EVENT_INPUT_VISIBLE, handleInputIsVisible)
    );
  }

  private fetchStatus(): Promise<Status> {
    const { noCache, type, onSearchError } = this.options;
    const alreadyFetched = Suggestions.statusByType[type];

    if (alreadyFetched && !noCache) return Promise.resolve(alreadyFetched);

    const request = this.api.status();

    request.then(
      (status) => {
        Suggestions.statusByType[type] = status;
      },
      (error) => onSearchError?.(error, null, this.el)
    );

    return request;
  }

  private initImplementation(status: Status): Implementation {
    const implementation = new this.ImplementationClass(this.el, {
      ...this.options,
      helperElements: Array.prototype.slice.call(
        this.options.helperElements || []
      ),
      api: this.api,
      input: this.input,
      plan: status.plan,
    }) as Implementation;

    this.onDispose(() => implementation.dispose());

    this.execCalls.forEach(([action, args, resolve, reject]) => {
      try {
        resolve(implementation[action](...args));
      } catch (error) {
        reject(error);
      }
    });

    return implementation;
  }
}
