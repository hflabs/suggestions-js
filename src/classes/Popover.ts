import { addClass, removeClass, toClassName } from "../utils/className";
import classes from "./Popover.sass";
import promoSvg from "../svg/promo.svg";
import { createElement } from "../utils/createElement";
import { InnerInitOptions } from "../types";
import Disposable from "./Disposable";
import { isPositiveNumber } from "../utils/isNumber";
import { throttle } from "../utils/throttle";
import { isMobileViewport } from "../utils/isMobileViewport";
import PositionObserver from "./PositionObserver";

const PROMO_HREF =
  "https://dadata.ru/suggestions/?utm_source=dadata&utm_medium=module&utm_campaign=suggestions-jquery";

export interface PopoverInitOptions
  extends Pick<
    InnerInitOptions<unknown>,
    "classNames" | "mobileMaxWidth" | "hint" | "noSuggestionsHint"
  > {
  showPromo: boolean;
  items: string[];
  onMousedown: () => void;
  onItemClick: (index: number) => void;
}

/**
 * Maintain dropdown content.
 * Render suggestions, highlight them.
 */
export default class Popover extends Disposable {
  private container: Element = document.body;
  private el: HTMLDivElement = createElement("div", {
    className: toClassName(classes.popover, this.options.classNames?.popover),
  });
  private items: HTMLLIElement[] = this.createItems(this.options.items);
  private alignThrottleTimeout = 50;

  constructor(
    private target: HTMLInputElement,
    private options: PopoverInitOptions
  ) {
    super();
    this.mount();
    this.align();
    this.initPositionObserver();
    this.render();
    this.listenToMousedown();
    this.observeViewportSize();
  }

  public setItems(items: string[]): void {
    this.items = this.createItems(items);
    this.render();
  }

  public highlightItem(index: number): void {
    this.items.forEach((el, i) => {
      if (i === index) {
        addClass(el, classes.isHighlighted);
      } else {
        removeClass(el, classes.isHighlighted);
      }
    });
  }

  private mount() {
    this.container.appendChild(this.el);
    this.onDispose(() => this.container.removeChild(this.el));
  }

  private align() {
    const elRect = this.target.getBoundingClientRect();
    const { style } = this.el;

    style.top = `${elRect.bottom + this.container.scrollTop}px`;
    style.left = `${elRect.left + this.container.scrollLeft}px`;
    style.width = `${elRect.width}px`;
  }

  private initPositionObserver() {
    const observer = new PositionObserver(
      this.target,
      throttle(() => this.align(), this.alignThrottleTimeout)
    );

    this.onDispose(() => observer.dispose());
  }

  private render() {
    const { classNames, hint, noSuggestionsHint, showPromo } = this.options;
    const { items } = this;
    const fragment = document.createDocumentFragment();

    const hintText = items.length ? hint : noSuggestionsHint;
    if (hintText) {
      const hintElement = createElement("div", {
        className: toClassName(classes.hint, classNames?.hint),
        textContent: hintText,
      });

      fragment.appendChild(hintElement);
    }

    const list = createElement("ul", {
      className: toClassName(classes.list, classNames?.list),
    });
    list.append(...items);
    fragment.appendChild(list);

    if (showPromo) {
      fragment.appendChild(
        createElement("a", {
          className: classes.promo,
          target: "_blank",
          tabIndex: -1,
          href: PROMO_HREF,
          innerHTML: promoSvg,
        })
      );
    }

    this.el.innerHTML = "";
    this.el.appendChild(fragment);
  }

  private createItems(itemsHtml: string[]) {
    const { classNames, onItemClick } = this.options;
    const items = itemsHtml.map((innerHTML) =>
      createElement("li", {
        className: toClassName(classes.item, classNames?.item),
        innerHTML,
      })
    );

    // No need to unsubscribe
    items.forEach((el, i) =>
      el.addEventListener("click", () => onItemClick(i))
    );

    return items;
  }

  private listenToMousedown() {
    this.addDisposableEventListener(
      this.el,
      "mousedown",
      this.options.onMousedown
    );
  }

  private observeViewportSize() {
    // Apply mobile styles on window resize
    const { mobileMaxWidth } = this.options;

    if (isPositiveNumber(mobileMaxWidth)) {
      let wasMobile = false;
      const updateIsMobile = throttle(() => {
        const isMobile = isMobileViewport(window, mobileMaxWidth);

        if (isMobile !== wasMobile) {
          if (isMobile) {
            addClass(this.el, classes.isMobile);
          } else {
            removeClass(this.el, classes.isMobile);
          }
          wasMobile = isMobile;
        }
      }, this.alignThrottleTimeout);

      updateIsMobile();

      this.addDisposableEventListener(window, "resize", updateIsMobile);
    }
  }
}
