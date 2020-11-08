import { queuedPromiseFactory } from "./queuedPromiseFactory";

describe("queuedPromiseFactory", () => {
  it("should resolve sequent calls", async () => {
    const createPromise = queuedPromiseFactory((n: number) =>
      Promise.resolve(n)
    );

    for (let i = 0; i < 5; i++) {
      const call = createPromise(i);
      await call;
      await expect(call).resolves.toBe(i);
    }
  });

  it("should abort previous call when the next call pushed", async () => {
    const createPromise = queuedPromiseFactory(
      (n: number) => Promise.resolve(n),
      () => new Error("aborted by the next call")
    );
    const count = 5;
    const calls = [];

    for (let i = 0; i < count; i++) {
      calls.push(createPromise(i));
    }

    for (let i = 0; i < count; i++) {
      if (i < count - 1) {
        await expect(calls[i]).rejects.toThrow("aborted by the next call");
      } else {
        await expect(calls[i]).resolves.toBe(i);
      }
    }
  });

  it("should collapse calls with same arguments", async () => {
    const factory = jest.fn((n: number) => Promise.resolve(n));
    const createPromise = queuedPromiseFactory(
      factory,
      () => new Error("aborted by the next call")
    );
    const count = 5;
    const calls = [];

    for (let i = 0; i < count; i++) {
      calls.push(createPromise(10));
    }

    for (let i = 0; i < count; i++) {
      await expect(calls[i]).resolves.toBe(10);
    }

    expect(factory).toHaveBeenCalledTimes(1);
  });
});
