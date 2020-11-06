export default class Disposable {
  private onDisposeHandlers: (() => void)[] = [];

  protected onDispose(handler: () => void) {
    this.onDisposeHandlers.push(handler);
  }

  public dispose() {
    this.onDisposeHandlers.forEach((handler) => handler());
    this.onDisposeHandlers.length = 0;
  }

  public setDisposableTimeout(
    fn: (...args: any[]) => void,
    ms?: number,
    ...fnArgs: any[]
  ) {
    const timeoutId = window.setTimeout(fn, ms, ...fnArgs);
    this.onDispose(() => clearTimeout(timeoutId));
  }

  public setDisposableInterval(
    fn: (...args: any[]) => void,
    ms?: number,
    ...fnArgs: any[]
  ) {
    const timeoutId = window.setInterval(fn, ms, ...fnArgs);
    this.onDispose(() => clearInterval(timeoutId));
  }

  public addDisposableEventListener<T extends EventTarget, E extends Event>(
    el: T,
    type: string,
    handler: (this: T, e: E) => void
  ) {
    el.addEventListener(type, handler as EventListener);
    this.onDispose(() =>
      el.removeEventListener(type, handler as EventListener)
    );
  }
}
