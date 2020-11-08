import Popover, { PopoverInitOptions } from "./Popover";
import { defaultOptions } from "../defaultOption";
import { noop } from "../utils/noop";
import popoverSass from "./Popover.sass";
import "@testing-library/jest-dom";

describe("class Popover", () => {
  const initOptions: PopoverInitOptions = {
    mobileMaxWidth: defaultOptions.mobileMaxWidth,
    hint: defaultOptions.hint,
    noSuggestionsHint: defaultOptions.noSuggestionsHint,
    showPromo: false,
    items: [],
    onMousedown: noop,
    onItemClick: noop,
  };

  let el: HTMLInputElement;

  beforeEach(() => {
    el = document.body.appendChild(document.createElement("input"));
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  const withPopover = (
    options: PopoverInitOptions,
    fn: (popover: Popover) => void
  ): void => {
    const popover = new Popover(el, options);
    fn(popover);
    popover.dispose();
  };

  it("should render root element", () => {
    withPopover(initOptions, () => {
      expect(document.getElementsByClassName(popoverSass.popover)).toHaveLength(
        1
      );
    });
  });

  it("should render root element with custom class", () => {
    withPopover(
      { ...initOptions, classNames: { popover: "custom-popover-class" } },
      () => {
        expect(
          document.getElementsByClassName("custom-popover-class")
        ).toHaveLength(1);
      }
    );
  });

  it("should render hint", () => {
    withPopover(
      {
        ...initOptions,
        classNames: { hint: "hint-class" },
        items: ["item1"],
      },
      () => {
        const hint = document.getElementsByClassName("hint-class")[0];

        expect(hint).toBeInstanceOf(HTMLElement);
        expect((hint as HTMLElement).textContent).toBe(initOptions.hint);
      }
    );
  });

  it("should render hint when no items present", () => {
    withPopover(
      {
        ...initOptions,
        classNames: { hint: "hint-class" },
        items: [],
      },
      () => {
        const hint = document.getElementsByClassName("hint-class")[0];

        expect(hint).toBeInstanceOf(HTMLElement);
        expect((hint as HTMLElement).textContent).toBe(
          initOptions.noSuggestionsHint
        );
      }
    );
  });

  it("should render promo", () => {
    withPopover(
      {
        ...initOptions,
        showPromo: true,
      },
      () => {
        const promo = document.getElementsByClassName(popoverSass.promo)[0];

        expect(promo).toBeInstanceOf(HTMLAnchorElement);
        expect(promo?.children[0]).toBeInstanceOf(SVGElement);
      }
    );
  });

  it("should render items at the very top when no promo and no hint to display", () => {
    withPopover(
      {
        ...initOptions,
        hint: "",
        noSuggestionsHint: "",
        showPromo: false,
      },
      () => {
        expect(document.getElementsByClassName(popoverSass.hint)).toHaveLength(
          0
        );
      }
    );
  });

  it("should render items", () => {
    const itemsCount = 5;

    withPopover(
      {
        ...initOptions,
        classNames: { item: "item-class" },
        items: Array.from(Array(itemsCount)).map((_, i) => `item${i}`),
      },
      () => {
        const items = document.getElementsByClassName("item-class");

        expect(items).toHaveLength(itemsCount);
      }
    );
  });

  it("should render items set with .setItems", () => {
    const itemsCount = 5;

    withPopover(initOptions, (popover) => {
      expect(document.getElementsByClassName(popoverSass.item)).toHaveLength(0);

      popover.setItems(Array.from(Array(itemsCount)).map((_, i) => `item${i}`));

      expect(document.getElementsByClassName(popoverSass.item)).toHaveLength(
        itemsCount
      );
    });
  });

  it("should highlightItem items", () => {
    const itemsCount = 5;
    const highlightedItemIndex = 2;

    withPopover(
      {
        ...initOptions,
        items: Array.from(Array(itemsCount)).map((_, i) => `item${i}`),
      },
      (popover) => {
        const items = document.getElementsByClassName(popoverSass.item);

        expect(items).toHaveLength(itemsCount);
        expect(
          document.getElementsByClassName(popoverSass.isHighlighted)
        ).toHaveLength(0);

        popover.highlightItem(highlightedItemIndex);

        const highlightedItems = document.getElementsByClassName(
          popoverSass.isHighlighted
        );

        expect(highlightedItems).toHaveLength(1);
        expect(highlightedItems[0]).toBe(items.item(highlightedItemIndex));
      }
    );
  });

  it("should invoke onMousedown", () => {
    const fn = jest.fn();

    withPopover(
      {
        ...initOptions,
        items: ["item"],
        showPromo: true,
        onMousedown: fn,
      },
      () => {
        const descendants = document.querySelectorAll(
          `.${popoverSass.popover} *`
        );

        descendants.forEach((descendant) =>
          descendant.dispatchEvent(new Event("mousedown", { bubbles: true }))
        );

        expect(fn).toHaveBeenCalledTimes(descendants.length);
      }
    );
  });

  it("should invoke onItemClick", () => {
    const onItemClick = jest.fn();

    withPopover(
      {
        ...initOptions,
        items: ["item1", "item2"],
        onItemClick,
      },
      () => {
        const items = document.getElementsByClassName(popoverSass.item);
        const indexOfItemToClick = 1;

        items[indexOfItemToClick].dispatchEvent(new Event("click"));

        expect(onItemClick).toHaveBeenCalledTimes(1);
        expect(onItemClick).toHaveBeenLastCalledWith(indexOfItemToClick);
      }
    );
  });

  it("should toggle styles for mobile screens", () => {
    const innerWidthDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "innerWidth"
    );

    if (!innerWidthDescriptor)
      throw new Error("Can not mock window innerWidth");

    jest.useFakeTimers();
    withPopover(initOptions, () => {
      // Simulate window is resized to mobile
      Object.defineProperty(window, "innerWidth", {
        value: 1,
      });

      // Resize handler is throttled
      jest.runAllTimers();
      window.dispatchEvent(new Event("resize"));

      expect(
        document.getElementsByClassName(popoverSass.popover)[0]
      ).toHaveClass(popoverSass.isMobile);

      // Simulate window is resized to desktop
      Object.defineProperty(window, "innerWidth", {
        value: 1024,
      });

      // Resize handler is throttled
      jest.runAllTimers();
      window.dispatchEvent(new Event("resize"));

      expect(
        document.getElementsByClassName(popoverSass.popover)[0]
      ).not.toHaveClass(popoverSass.isMobile);
    });
    jest.useRealTimers();

    Object.defineProperty(window, "innerWidth", innerWidthDescriptor);
  });
});
