import { IImplementationOptions } from "../types";
import Api, { TApiStatusPlan } from "../Api/Api";
import Input, { EVENT_INPUT_CHANGE } from "../Input/Input";
import ImplementationBase, { TPublicMethodCall } from "./ImplementationBase";

export interface IRequestModeOptions<D> extends IImplementationOptions<D> {
  api: Api<D>;
  input: Input;
  plan?: TApiStatusPlan;
  publicCalls: TPublicMethodCall[];
}

export default class ImplementationFindById<D> extends ImplementationBase<D> {
  constructor(
    protected el: HTMLInputElement,
    protected options: IRequestModeOptions<D>
  ) {
    super(el, options);
    this.listenToInputChange();
  }

  protected listenToInputChange(): void {
    this.addDisposableEventListener(this.el, EVENT_INPUT_CHANGE, () =>
      this.proceedInputChange()
    );
  }

  protected proceedInputChange(): void {
    const { input } = this.options;
    const query = input.getValue().trim();

    if (this.isQueryRequestable(query)) {
      this.fetchSuggestion(query).then((suggestion) => {
        // Value has changed while data was been fetched
        if (input.getValue() !== query) return;

        this.setSuggestion(suggestion);
      });
    }
  }
}
