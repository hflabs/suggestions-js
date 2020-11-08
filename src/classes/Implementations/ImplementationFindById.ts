import { EVENT_INPUT_CHANGE } from "../Input";
import ImplementationBase, {
  ImplementationBaseOptions,
} from "./ImplementationBase";
import { noop } from "../../utils/noop";
import { queuedPromiseFactory } from "../../utils/queuedPromiseFactory";

export default class ImplementationFindById<D> extends ImplementationBase<D> {
  private fetchSuggestionWithCallbacks = this.triggeringSearchCallbacks(
    queuedPromiseFactory(this.fetchSuggestion.bind(this))
  );

  constructor(
    protected el: HTMLInputElement,
    protected options: ImplementationBaseOptions<D>
  ) {
    super(el, options);
    this.listenToInput();
  }

  protected listenToInput(): void {
    this.addDisposableEventListener(this.el, EVENT_INPUT_CHANGE, () =>
      this.proceedInputChange()
    );
  }

  protected proceedInputChange(): void {
    const { input } = this.options;

    const query = input.getValue().trim();

    if (this.isQueryRequestable(query)) {
      this.fetchSuggestionWithCallbacks(query)
        .then((suggestion) => {
          // Check the value has changed while data was been fetched
          if (input.getValue().trim() !== query) return;

          this.setCurrentSuggestion(suggestion);
        })
        .catch(noop);
    }
  }
}
