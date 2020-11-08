import Disposable from "./Disposable";

/**
 * Observer position of `target` element (relative to document) changed
 */
export default class PositionObserver extends Disposable {
  constructor(private target: Element, private onShouldAlign: () => void) {
    super();
    this.observeParentsScroll();
    this.observeDomChanges();
    this.addDisposableEventListener(window, "resize", this.onShouldAlign);
    this.addDisposableEventListener(
      document,
      "transitionend",
      this.onShouldAlign
    );
  }

  /**
   * Track `target` element is scrolled.
   * `scroll` event does not bubble, so listen to all parents of the `target` element
   */
  private observeParentsScroll() {
    const targetParents: (Element | Window)[] = [];
    let parent: Element | null = this.target.parentElement;

    while (parent) {
      targetParents.push(parent);
      parent = parent.parentElement;
    }

    targetParents.forEach((el) =>
      this.addDisposableEventListener(el, "scroll", this.onShouldAlign)
    );
  }

  /**
   * Track some content added/removed/resized above the `target`
   */
  private observeDomChanges() {
    if (typeof MutationObserver === "function") {
      const observer = new MutationObserver(this.onShouldAlign);

      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        childList: true,
      });

      this.onDispose(() => observer.disconnect());
    } else {
      this.setDisposableInterval(this.onShouldAlign, 1000);
    }
  }
}
