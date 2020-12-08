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
    const timeoutId = setTimeout(fn, ms, ...fnArgs);
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
    const intervalId = setInterval(fn, ms, ...fnArgs);
    this.onDispose(() => clearInterval(intervalId));
    return intervalId;
  }

  /**
   * Add event listener on some element. Listener will be removed when the instance is disposed.
   *
   * @param target
   * @param type
   * @param handler
   * @protected
   */
  protected addDisposableEventListener<
    Target extends EventTarget,
    E extends Event
  >(target: Target, type: string, handler: (this: Target, e: E) => void): void {
    target.addEventListener(type, handler as EventListener);
    this.onDispose(() =>
      target.removeEventListener(type, handler as EventListener)
    );
  }
}

export default Disposable;
