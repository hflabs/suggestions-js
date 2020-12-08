import { EVENT_INPUT_CHANGE } from "../Input";
import ImplementationBase, {
  ImplementationBaseOptions,
} from "./ImplementationBase";
import { queuedPromiseFactory } from "../../utils/queuedPromiseFactory";
import { noop } from "../../utils/noop";

export default class ImplementationFindById<
  SuggestionData
> extends ImplementationBase<SuggestionData> {
  private fetchSuggestionWithCallbacks = this.triggeringSearchCallbacks(
    queuedPromiseFactory(this.fetchSuggestion.bind(this))
  );

  constructor(
    protected el: HTMLInputElement,
    protected options: ImplementationBaseOptions<SuggestionData>
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
