import Disposable from "./Disposable";
import runAllTimers = jest.runAllTimers;
import { noop } from "../utils/noop";

describe("class Disposable", () => {
  it('should have "dispose" method', () => {
    class D extends Disposable {}

    expect(new D()).toHaveProperty("dispose", expect.any(Function));
  });

  it('should add dispose handler via "onDispose" method', () => {
    const fn = jest.fn();
    class D extends Disposable {
      constructor() {
        super();
        this.onDispose(fn);
      }
    }

    const d = new D();
    d.dispose();

    expect(fn).toHaveBeenCalled();
  });

  it("should call dispose handlers in reverse order", () => {
    let calls = 0;
    const fn1 = jest.fn(() => ++calls);
    const fn2 = jest.fn(() => ++calls);

    class D extends Disposable {
      constructor() {
        super();
        this.onDispose(fn1);
        this.onDispose(fn2);
      }
    }

    const d = new D();
    d.dispose();

    expect(fn1).toHaveReturnedWith(2);
    expect(fn2).toHaveReturnedWith(1);
  });

  it('should cancel timeout set via "setDisposableTimeout" method', () => {
    jest.useFakeTimers();

    const fn = jest.fn();

    class D extends Disposable {
      constructor() {
        super();
        this.setDisposableTimeout(fn, 10);
      }
    }

    const d = new D();
    d.dispose();

    runAllTimers();

    expect(fn).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should stop interval set via "setDisposableInterval" method', () => {
    jest.useFakeTimers();

    const fn = jest.fn();

    class D extends Disposable {
      constructor() {
        super();
        this.setDisposableInterval(fn, 10);
      }
    }

    const d = new D();
    d.dispose();

    runAllTimers();

    expect(fn).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should remove event listener set via "addDisposableEventListener" method', () => {
    const el = document.createElement("div");
    const fn = jest.fn();

    el.removeEventListener = fn;

    class D extends Disposable {
      constructor() {
        super();
        this.addDisposableEventListener(el, "click", noop);
      }
    }

    const d = new D();
    d.dispose();

    expect(fn).toHaveBeenCalledWith("click", noop);
  });
});
