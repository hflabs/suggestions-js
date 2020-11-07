/**
 * Provides neat disposing of the instance
 */
abstract class Disposable {
  private disposeHandlers: (() => void)[] = [];

  public dispose(): void {
    this.disposeHandlers.reverse().forEach((handler) => handler());
    this.disposeHandlers.length = 0;
  }

  /**
   * Add some action to be done on dispose
   *
   * @param handler
   * @protected
   */
  protected onDispose(handler: () => void): void {
    this.disposeHandlers.push(handler);
  }

  /**
   * Run setTimeout. If the timeout is not reached at the disposing moment, it will be canceled.
   *
   * @param fn
   * @param ms
   * @param fnArgs
   * @protected
   */
  protected setDisposableTimeout(
    fn: (...args: unknown[]) => void,
    ms?: number,
    ...fnArgs: unknown[]
  ): number {
    const timeoutId = window.setTimeout(fn, ms, ...fnArgs);
    this.onDispose(() => clearTimeout(timeoutId));
    return timeoutId;
  }

  /**
   * Run setInterval. Stops it when the instance is disposed.
   *
   * @param fn
   * @param ms
   * @param fnArgs
   * @protected
   */
  protected setDisposableInterval(
    fn: (...args: unknown[]) => void,
    ms?: number,
    ...fnArgs: unknown[]
  ): number {
    const intervalId = window.setInterval(fn, ms, ...fnArgs);
    this.onDispose(() => clearInterval(intervalId));
    return intervalId;
  }

  /**
   * Add event listener on some element. Listener will be removed when the instance is disposed.
   *
   * @param el
   * @param type
   * @param handler
   * @protected
   */
  protected addDisposableEventListener<T extends EventTarget, E extends Event>(
    el: T,
    type: string,
    handler: (this: T, e: E) => void
  ): void {
    el.addEventListener(type, handler as EventListener);
    this.onDispose(() =>
      el.removeEventListener(type, handler as EventListener)
    );
  }
}

export default Disposable;
