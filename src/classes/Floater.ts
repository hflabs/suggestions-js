import Disposable from "./Disposable";
import { createElement } from "../utils/createElement";
import { addClass, removeClass, toClassName } from "../utils/className";
import classes from "./Popover.sass";
import { throttle } from "../utils/throttle";
import { isMobileViewport } from "../utils/isMobileViewport";
import { InnerInitOptions } from "../types";
import { isPositiveNumber } from "../utils/isNumber";

type FloaterInitOptions = Pick<
  InnerInitOptions<unknown>,
  "classNames" | "mobileMaxWidth"
>;

/**
 * Creates a floating container, positioned along the bottom edge of `target` element
 */
export default class Floater extends Disposable {
  private container: Element = document.body;
  private el: HTMLDivElement = createElement("div", {
    className: toClassName(classes.popover, this.options.classNames?.popover),
  });
  private alignThrottleTimeout = 50;
  private mobileModeThrottleTimeout = 100;

  constructor(
    private target: HTMLInputElement,
    private options: FloaterInitOptions
  ) {
    super();
    this.mount();
    this.align();
    this.observeTargetParents();
    this.observeDomMutations();
    this.observeWindowResize();
    this.observeDocumentTransitionEnd();
  }

  public getElement(): HTMLDivElement {
    return this.el;
  }

  private align() {
    const elRect = this.target.getBoundingClientRect();
    const { style } = this.el;

    style.top = `${elRect.bottom + this.container.scrollTop}px`;
    style.left = `${elRect.left + this.container.scrollLeft}px`;
    style.width = `${elRect.width}px`;
  }

  private throttledAlign = throttle(
    () => this.align(),
    this.alignThrottleTimeout
  );

  private mount() {
    this.container.appendChild(this.el);

    this.onDispose(() => this.container.removeChild(this.el));
  }

  /**
   * Track `target` element is scrolled.
   * `scroll` event does not bubble, so listen to all parents of the `target` element
   */
  private observeTargetParents() {
    const targetParents: (Element | Window)[] = [];
    let parent: Element | null = this.target.parentElement;

    while (parent) {
      targetParents.push(parent);
      parent = parent.parentElement;
    }

    targetParents.forEach((el) =>
      this.addDisposableEventListener(el, "scroll", this.throttledAlign)
    );
  }

  /**
   * Track some content added/removed/resized above the `target`
   */
  private observeDomMutations() {
    if (typeof MutationObserver === "function") {
      const observer = new MutationObserver(this.throttledAlign);

      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        childList: true,
      });

      this.onDispose(() => observer.disconnect());
    } else {
      this.setDisposableInterval(this.throttledAlign, 1000);
    }
  }

  private observeWindowResize() {
    this.addDisposableEventListener(window, "resize", this.throttledAlign);

    // Apply mobile styles on window resize
    const { mobileMaxWidth } = this.options;

    if (isPositiveNumber(mobileMaxWidth)) {
      let wasMobile = false;
      const throttledUpdateIsMobile = throttle(() => {
        const isMobile = isMobileViewport(window, mobileMaxWidth);

        if (isMobile !== wasMobile) {
          if (isMobile) {
            addClass(this.el, classes.isSelected);
          } else {
            removeClass(this.el, classes.isSelected);
          }
          wasMobile = isMobile;
        }
      }, this.mobileModeThrottleTimeout);

      throttledUpdateIsMobile();

      this.addDisposableEventListener(
        window,
        "resize",
        throttledUpdateIsMobile
      );
    }
  }

  private observeDocumentTransitionEnd() {
    this.addDisposableEventListener(
      document,
      "transitionend",
      this.throttledAlign
    );
  }
}
