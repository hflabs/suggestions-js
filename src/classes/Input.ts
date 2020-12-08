import { InnerInitOptions } from "../types";
import Disposable from "./Disposable";
import { addClass, removeClass } from "../utils/className";
import classes from "./Input.sass";
import { debounce } from "../utils/debounce";
import { isPositiveNumber } from "../utils/isNumber";

export const EVENT_INPUT_VISIBLE = "suggestions-input-visible";
export const EVENT_INPUT_CHANGE = "suggestions-value-change";

// if it stops working, see https://stackoverflow.com/q/15738259
// chrome is constantly changing this logic
export const INPUT_ENHANCE_ATTRIBUTES = {
  autocomplete: "off",
  autocorrect: "off",
  autocapitalize: "off",
  spellcheck: "false",
};

export type InputInitOptions = Pick<
  InnerInitOptions<unknown>,
  "classNames" | "deferRequestBy"
>;

/**
 * Enhance the text-field element.
 *
 * Set attributes to disable browser's enhancing like spellcheck.
 * Observe text-field visibility. Provide cross-browser onChange event.
 */
export default class Input extends Disposable {
  private currentValue: string = this.el.value;
  private suggestedValue: string | null = null;

  constructor(private el: HTMLInputElement, private options: InputInitOptions) {
    super();
    this.setupElementClass();
    this.setupAttributes();
    this.attachEventHandlers();
    this.observeVisibility();
  }

  public getValue(): string {
    this.checkIfValueChanged();
    return this.currentValue;
  }

  public setValue(value: string): void {
    this.currentValue = value;
    this.el.value = value;
  }

  /**
   * Set input's value, but not the .currentValue to
   */
  public suggestValue(value: string | null): void {
    this.suggestedValue = value;

    if (value === null) {
      this.el.value = this.currentValue;
    } else {
      this.currentValue = this.el.value;
      this.el.value = value;
    }
  }

  private setupElementClass() {
    const className = this.options.classNames?.input;

    addClass(this.el, classes.input, className);

    this.onDispose(() => removeClass(this.el, classes.input, className));
  }

  private setupAttributes() {
    const initialAttributes: Record<string, string | null> = Object.keys(
      INPUT_ENHANCE_ATTRIBUTES
    ).reduce(
      (memo, attributeName) => ({
        ...memo,
        [attributeName]: this.el.getAttribute(attributeName),
      }),
      {}
    );

    Object.entries(
      INPUT_ENHANCE_ATTRIBUTES
    ).forEach(([attributeName, attributeValue]) =>
      this.el.setAttribute(attributeName, attributeValue)
    );

    this.onDispose(() => {
      Object.entries(initialAttributes).forEach(
        ([attributeName, initialValue]) => {
          if (initialValue === null) {
            this.el.removeAttribute(attributeName);
          } else {
            this.el.setAttribute(attributeName, initialValue);
          }
        }
      );
    });
  }

  private observeVisibility() {
    let isVisibleDispatched = false;
    const dispatchIsVisible = () => {
      this.el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      isVisibleDispatched = true;
    };

    // The best strategy is to use IntersectionObserver
    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver((entries) => {
        const isVisible = entries.some((entry) => entry.intersectionRatio > 0);

        if (isVisible) {
          dispatchIsVisible();
          observer.disconnect();
        }
      });

      observer.observe(this.el);

      this.onDispose(() => {
        if (!isVisibleDispatched) observer.disconnect();
      });
    } else {
      // Fallback strategy is to periodically check element's offsetParent.
      // This strategy tracks only cases when the element is hidden, does not track scroll
      let intervalId: number | null = null;

      const checkVisibility = () => {
        const isVisible = Boolean(this.el.offsetParent);

        if (isVisible) {
          dispatchIsVisible();
          if (intervalId) clearInterval(intervalId);
        }
      };

      checkVisibility();

      if (!isVisibleDispatched) {
        intervalId = window.setInterval(checkVisibility, 500);

        this.onDispose(() => {
          if (!isVisibleDispatched && intervalId) clearInterval(intervalId);
        });
      }
    }
  }

  private debouncedTriggerOnChange = debounce(
    () => this.el.dispatchEvent(new Event(EVENT_INPUT_CHANGE)),
    isPositiveNumber(this.options.deferRequestBy)
      ? this.options.deferRequestBy
      : 0
  );

  private checkIfValueChanged() {
    const { value } = this.el;

    if (value !== this.suggestedValue && value !== this.currentValue) {
      this.currentValue = value;
      this.debouncedTriggerOnChange();
    }
  }

  private attachEventHandlers() {
    const handleKeyup = debounce(() => this.checkIfValueChanged(), 0);

    // IE is buggy, it doesn't trigger `input` on text deletion, so use following events
    this.addDisposableEventListener(this.el, "keyup", handleKeyup);
    this.addDisposableEventListener(this.el, "cut", handleKeyup);
    this.addDisposableEventListener(this.el, "paste", handleKeyup);
    this.addDisposableEventListener(this.el, "input", handleKeyup);

    this.addDisposableEventListener(this.el, "focus", () => {
      // Check if value was updated by external js
      this.checkIfValueChanged();
    });
  }
}
