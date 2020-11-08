import { isNumber } from "./isNumber";

const intersectionRect = (
  rect: DOMRectReadOnly,
  intersectionRatio: number
): DOMRectReadOnly => {
  const width = rect.width * intersectionRatio;
  const height = rect.height * intersectionRatio;
  return {
    ...rect,
    width,
    height,
    bottom: rect.top + height,
    right: rect.left + width,
  };
};

export class IntersectionObserverMock implements IntersectionObserver {
  private static observers: Set<IntersectionObserverMock> = new Set();
  public static intersectElement = (
    el: Element,
    intersectionRatio: number
  ): void =>
    IntersectionObserverMock.observers.forEach((observer) =>
      observer.mockTriggerIntersection(el, intersectionRatio)
    );

  private observedElements: Map<Element, IntersectionObserverEntry> = new Map();

  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(
    private callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) {
    IntersectionObserverMock.observers.add(this);
    this.root = options?.root || null;
    this.rootMargin = options?.rootMargin || "0";
    this.thresholds = [options?.threshold].filter(isNumber);
  }

  public observe(target: Element): void {
    const boundingClientRect = target.getBoundingClientRect();

    this.observedElements.set(target, {
      boundingClientRect,
      intersectionRatio: 0,
      isIntersecting: false,
      intersectionRect: intersectionRect(boundingClientRect, 0),
      rootBounds: null,
      target,
      time: Date.now(),
    });
  }

  public unobserve(el: Element): void {
    this.observedElements.delete(el);
  }

  public disconnect(): void {
    this.observedElements.clear();
  }

  public takeRecords(): IntersectionObserverEntry[] {
    return Array.from(this.observedElements.values());
  }

  private mockTriggerIntersection(
    target: Element,
    intersectionRatio: number
  ): void {
    const prevEntry = this.observedElements.get(target);

    if (prevEntry) {
      const boundingClientRect = target.getBoundingClientRect();

      const entry: IntersectionObserverEntry = {
        boundingClientRect,
        intersectionRatio,
        isIntersecting: prevEntry.intersectionRatio < intersectionRatio,
        intersectionRect: intersectionRect(
          boundingClientRect,
          intersectionRatio
        ),
        rootBounds: null,
        target,
        time: Date.now(),
      };

      this.observedElements.set(target, entry);

      this.callback([entry]);
    }
  }
}
