import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should debounce a function", () => {
    const fn = jest.fn((a: unknown) => a);
    const debounced = debounce(fn, 10);

    debounced("a");
    debounced("b");
    debounced("c");

    expect(fn).toHaveBeenCalledTimes(0);

    jest.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith("c");
  });

  it("should cancel pending calls", () => {
    const fn = jest.fn((a: unknown) => a);
    const debounced = debounce(fn, 10);

    debounced("a");
    debounced("b");
    debounced("c");

    expect(fn).toHaveBeenCalledTimes(0);

    debounced.cancel();
    jest.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(0);
  });

  it("should do nothing on cancel before any calls", () => {
    const fn = jest.fn((a: unknown) => a);
    const debounced = debounce(fn, 10);

    debounced.cancel();

    jest.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(0);
  });
});
