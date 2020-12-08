import Disposable from "./Disposable";
import { deepEqual } from "../utils/deepEqual";

/**
 * Observe when position of `target` element changed relatively to document
 */
export default class PositionObserver extends Disposable {
  private targetRect = this.target.getBoundingClientRect();

  constructor(private target: Element, private onPositionChange: () => void) {
    super();
    this.observeParentsScroll();
    this.observeDomChanges();
    this.addDisposableEventListener(
      window,
      "resize",
      this.handleDocumentChange
    );
    this.addDisposableEventListener(
      document,
      "transitionend",
      this.handleDocumentChange
    );
  }

  private handleDocumentChange = () => {
    const rect = this.target.getBoundingClientRect();

    if (!deepEqual(rect, this.targetRect)) {
      this.targetRect = rect;
      this.onPositionChange();
    }
  };

  /**
   * Track `target` element is scrolled.
   * `scroll` event does not bubble, so listen to all parents of the `target` element
   */
  private observeParentsScroll() {
    const targetParents: Element[] = [];
    let parent: Element | null = this.target.parentElement;

    while (parent) {
      targetParents.push(parent);
      parent = parent.parentElement;
    }

    targetParents.forEach((el) =>
      this.addDisposableEventListener(el, "scroll", this.handleDocumentChange)
    );
  }

  /**
   * Track some content added/removed/resized above the `target`
   */
  private observeDomChanges() {
    if (typeof MutationObserver === "function") {
      const observer = new MutationObserver(this.handleDocumentChange);

      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        childList: true,
      });

      this.onDispose(() => observer.disconnect());
    } else {
      this.setDisposableInterval(this.handleDocumentChange, 1000);
    }
  }
}
