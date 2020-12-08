import Popover, { PopoverInitOptions } from "./Popover";
import { defaultOptions } from "../defaultOption";
import { noop } from "../utils/noop";
import popoverSass from "./Popover.sass";
import "@testing-library/jest-dom";
import { withMockedProperty } from "../../testUtils/withMockedProperty";
import { withFakeTimers } from "../../testUtils/withFakeTimers";
import { withElementMoved } from "../../testUtils/withElementMoved";

const getElementByClassName = (className: string) =>
  document.getElementsByClassName(className)[0];

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
    options: Partial<PopoverInitOptions> | null,
    fn: (popover: Popover) => void
  ): void => {
    const popover = new Popover(el, { ...initOptions, ...options });
    fn(popover);
    popover.dispose();
  };

  it("should render root element", () => {
    withPopover(null, () => {
      expect(getElementByClassName(popoverSass.popover)).toBeInTheDocument();
    });
  });

  it("should render root element with custom class", () => {
    withPopover({ classNames: { popover: "custom-popover-class" } }, () => {
      expect(getElementByClassName("custom-popover-class")).toBeInTheDocument();
    });
  });

  it("should render hint", () => {
    withPopover(
      {
        classNames: { hint: "hint-class" },
        items: ["item1"],
      },
      () => {
        const hint = getElementByClassName("hint-class");

        expect(hint).toBeInstanceOf(HTMLElement);
        expect((hint as HTMLElement).textContent).toBe(initOptions.hint);
      }
    );
  });

  it("should render hint when no items present", () => {
    withPopover(
      {
        classNames: { hint: "hint-class" },
        items: [],
      },
      () => {
        const hint = getElementByClassName("hint-class");

        expect(hint).toBeInstanceOf(HTMLElement);
        expect((hint as HTMLElement).textContent).toBe(
          initOptions.noSuggestionsHint
        );
      }
    );
  });

  it("should render promo", () => {
    withPopover({ showPromo: true }, () => {
      const promo = getElementByClassName(popoverSass.promo);

      expect(promo).toBeInstanceOf(HTMLAnchorElement);
      expect(promo?.children[0]).toBeInstanceOf(SVGElement);
    });
  });

  it("should render items at the very top when no promo and no hint to display", () => {
    withPopover(
      {
        hint: "",
        noSuggestionsHint: "",
        showPromo: false,
      },
      () => {
        expect(getElementByClassName(popoverSass.hint)).toBeUndefined();
      }
    );
  });

  it("should render items", () => {
    const itemsCount = 5;

    withPopover(
      {
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

    withPopover(null, (popover) => {
      expect(getElementByClassName(popoverSass.item)).toBeUndefined();

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
        items: Array.from(Array(itemsCount)).map((_, i) => `item${i}`),
      },
      (popover) => {
        const items = document.getElementsByClassName(popoverSass.item);

        expect(items).toHaveLength(itemsCount);
        expect(
          getElementByClassName(popoverSass.isHighlighted)
        ).toBeUndefined();

        popover.highlightItem(highlightedItemIndex);

        const highlightedItem = getElementByClassName(
          popoverSass.isHighlighted
        );

        expect(highlightedItem).toBeInTheDocument();
        expect(highlightedItem).toBe(items.item(highlightedItemIndex));
      }
    );
  });

  it("should invoke onMousedown", () => {
    const fn = jest.fn();

    withPopover(
      {
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

  it("should switch to mobile styles for narrow screens", () => {
    withFakeTimers(() => {
      withPopover(null, () => {
        withMockedProperty(window, "innerWidth", 1, () => {
          // Resize handler is throttled, let previous update to fulfil
          jest.runAllTimers();
          window.dispatchEvent(new Event("resize"));

          expect(getElementByClassName(popoverSass.popover)).toHaveClass(
            popoverSass.isMobile
          );
        });
      });
    });
  });

  it("should not switch to mobile styles when no mobileMaxWidth provided", () => {
    withFakeTimers(() => {
      withPopover({ mobileMaxWidth: 0 }, () => {
        withMockedProperty(window, "innerWidth", 1, () => {
          // Resize handler is throttled, let previous update to fulfil
          jest.runAllTimers();
          window.dispatchEvent(new Event("resize"));

          expect(getElementByClassName(popoverSass.popover)).not.toHaveClass(
            popoverSass.isMobile
          );
        });
      });
    });
  });

  it("should switch styles to desktop for wide screens", () => {
    withFakeTimers(() => {
      withMockedProperty(window, "innerWidth", 1, () => {
        withPopover(null, () => {
          withMockedProperty(window, "innerWidth", 1024, () => {
            // Resize handler is throttled, let previous update to fulfil
            jest.runAllTimers();
            window.dispatchEvent(new Event("resize"));

            expect(getElementByClassName(popoverSass.popover)).not.toHaveClass(
              popoverSass.isMobile
            );
          });
        });
      });
    });
  });

  it("should align with animationFrame", () => {
    const requestAnimationFrame = jest.fn();

    withMockedProperty(
      window,
      "requestAnimationFrame",
      requestAnimationFrame,
      () => {
        withPopover(null, () => {
          withElementMoved(el, () => {
            document.body.dispatchEvent(new Event("scroll"));
            expect(requestAnimationFrame).toHaveBeenCalled();
          });
        });
      }
    );
  });

  it("should align with throttled align", () => {
    withMockedProperty(window, "requestAnimationFrame", null, () => {
      withFakeTimers(() => {
        withPopover(null, (instance) => {
          // Spy on private method
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          const alignSpy = jest.spyOn(instance, "align");

          withElementMoved(el, () => {
            document.body.dispatchEvent(new Event("scroll"));
            jest.runAllTimers();
            expect(alignSpy).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
