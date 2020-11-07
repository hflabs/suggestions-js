import { InnerInitOptions } from "../types";
import Disposable from "./Disposable";
import { addClass, removeClass } from "../utils/className";
import classes from "./Input.sass";
import { debounce } from "../utils/debounce";
import { isString } from "../utils/isString";

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
  private lastValue: string = this.el.value;
  private suggestedValue: string | null = null;

  constructor(private el: HTMLInputElement, private options: InputInitOptions) {
    super();
    this.setupElementClass();
    this.setupAttributes();
    this.attachEventHandlers();
    this.observeVisibility();
  }

  public getValue(): string {
    // Due to currentValue is updated with some delay (options.deferRequestBy),
    // check is once more then it is required
    const { value } = this.el;

    if (value !== this.lastValue && value !== this.suggestedValue) {
      this.lastValue = value;
      this.el.dispatchEvent(new Event(EVENT_INPUT_CHANGE));
    }

    return this.lastValue;
  }

  public setValue(value: string): void {
    this.lastValue = value;
    this.el.value = value;
  }

  /**
   * Set input's value, but not the .currentValue to
   */
  public suggestValue(value: string | null): void {
    this.suggestedValue = value;

    if (value === null) {
      this.el.value = this.lastValue;
    } else {
      this.lastValue = this.el.value;
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
    let onVisibleDispatched = false;
    const dispatchIsVisible = () => {
      this.el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      onVisibleDispatched = true;
    };

    // The best strategy is to use IntersectionObserver
    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver((entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);

        if (isVisible) {
          dispatchIsVisible();
          observer.disconnect();
        }
      });

      observer.observe(this.el);

      this.onDispose(() => {
        if (!onVisibleDispatched) observer.disconnect();
      });
    } else {
      // Fallback strategy is to periodically check element's offsetParent.
      // It tracks only cases when the element is hidden, does not track scroll
      const intervalId = setInterval(() => {
        const isVisible = Boolean(this.el.offsetParent);

        if (isVisible) {
          dispatchIsVisible();
          clearInterval(intervalId);
        }
      }, 500);

      this.onDispose(() => {
        if (!onVisibleDispatched) clearInterval(intervalId);
      });
    }
  }

  private attachEventHandlers() {
    const handleKeyup = debounce(() => {
      const { value } = this.el;

      if (isString(this.suggestedValue) && value === this.suggestedValue)
        return;

      if (value !== this.lastValue) {
        this.lastValue = value;
        this.el.dispatchEvent(new Event(EVENT_INPUT_CHANGE));
      }
    }, this.options.deferRequestBy);

    // IE is buggy, it doesn't trigger `input` on text deletion, so use following events
    this.addDisposableEventListener(this.el, "keyup", handleKeyup);
    this.addDisposableEventListener(this.el, "cut", handleKeyup);
    this.addDisposableEventListener(this.el, "paste", handleKeyup);
    this.addDisposableEventListener(this.el, "input", handleKeyup);

    this.addDisposableEventListener(this.el, "focus", () => {
      // Update inner property if value was updated by external js
      this.lastValue = this.el.value;
    });
  }
}
