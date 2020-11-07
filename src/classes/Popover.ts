import { addClass, removeClass, toClassName } from "../utils/className";
import classes from "./Popover.sass";
import promoSvg from "../svg/promo.svg";
import { createElement } from "../utils/createElement";
import { InnerInitOptions } from "../types";
import Disposable from "./Disposable";
import Floater from "./Floater";

const PROMO_HREF =
  "https://dadata.ru/suggestions/?utm_source=dadata&utm_medium=module&utm_campaign=suggestions-jquery";

export interface PopoverOptions
  extends Pick<
    InnerInitOptions<unknown>,
    | "classNames"
    | "mobileMaxWidth"
    | "hint"
    | "noSuggestionsHint"
    | "triggerSelectOnEnter"
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
  private el: HTMLDivElement = this.initFloatingContainer();
  private items: HTMLDivElement[] = this.createItems(this.options.items);

  constructor(
    private target: HTMLInputElement,
    private options: PopoverOptions
  ) {
    super();
    this.render();
    this.listenToMousedown();
  }

  public setItems(items: string[]): void {
    this.items = this.createItems(items);
    this.render();
  }

  public highlightItem(index: number): void {
    this.items.forEach((el, i) => {
      if (i === index) {
        addClass(el, classes.isSelected);
      } else {
        removeClass(el, classes.isSelected);
      }
    });
  }

  private initFloatingContainer() {
    const { classNames, mobileMaxWidth } = this.options;
    const floater = new Floater(this.target, { classNames, mobileMaxWidth });

    this.onDispose(() => floater.dispose());

    return floater.getElement();
  }

  private render() {
    const { classNames, hint, noSuggestionsHint, showPromo } = this.options;
    const { items } = this;
    const fragment = document.createDocumentFragment();

    const hintText = items.length ? hint : noSuggestionsHint;
    if (hintText || showPromo) {
      const el = createElement("div", {
        className: toClassName(classes.hint, classNames?.hint),
      });

      el.appendChild(
        createElement("span", {
          className: classes.hintText,
          innerText: hintText,
        })
      );

      if (showPromo) {
        el.appendChild(
          createElement("a", {
            className: classes.promo,
            target: "_blank",
            tabIndex: -1,
            href: PROMO_HREF,
            innerHTML: promoSvg,
          })
        );
      }

      fragment.appendChild(el);
    }

    items.forEach((el) => fragment.appendChild(el));

    this.el.innerHTML = "";
    this.el.appendChild(fragment);
  }

  private createItems(itemsHtml: string[]) {
    const { classNames, onItemClick } = this.options;
    const items = itemsHtml.map((innerHTML) =>
      createElement("div", {
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
    const { onMousedown } = this.options;

    const handleMousedown = (e: MouseEvent) => {
      const { target } = e;

      if (!(target instanceof Element)) return;

      if (target === this.el || this.el.contains(target)) {
        onMousedown();
      }
    };

    this.addDisposableEventListener(document, "mousedown", handleMousedown);
  }
}
