import { IntersectionObserverMock } from "./IntersectionObserverMock";
import { noop } from "./noop";
import { as } from "./as";

describe("IntersectionObserverMock", () => {
  it("should have methods observe, unobserve, disconnect, takeRecords", () => {
    const observer = new IntersectionObserverMock(noop);
    expect(() => observer.observe(document.body)).not.toThrow();
    expect(() => observer.unobserve(document.body)).not.toThrow();
    expect(() => observer.disconnect()).not.toThrow();
    expect(() => observer.takeRecords()).not.toThrow();
  });

  it("should accept options", () => {
    expect(() => new IntersectionObserverMock(noop, {})).not.toThrow();
    expect(
      () => new IntersectionObserverMock(noop, { threshold: 0 })
    ).not.toThrow();
    expect(
      () => new IntersectionObserverMock(noop, { rootMargin: "0px" })
    ).not.toThrow();
    expect(
      () => new IntersectionObserverMock(noop, { root: document.body })
    ).not.toThrow();
  });

  it("should observe element is transitioning into view", () => {
    const fn = jest.fn();
    const observer = new IntersectionObserverMock(fn);

    observer.observe(document.body);
    IntersectionObserverMock.intersectElement(document.body, 0.12345);

    expect(fn).toHaveBeenCalledWith([
      expect.objectContaining(
        as<Partial<IntersectionObserverEntry>>({
          intersectionRatio: 0.12345,
          isIntersecting: true,
        })
      ),
    ]);
  });

  it("should observe element is transitioning out of view", () => {
    const fn = jest.fn();
    const observer = new IntersectionObserverMock(fn);

    observer.observe(document.body);
    IntersectionObserverMock.intersectElement(document.body, 0.12345);
    IntersectionObserverMock.intersectElement(document.body, 0.01);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith([
      expect.objectContaining(
        as<Partial<IntersectionObserverEntry>>({
          intersectionRatio: 0.01,
          isIntersecting: false,
        })
      ),
    ]);
  });

  it("should unobserve element", () => {
    const fn = jest.fn();
    const observer = new IntersectionObserverMock(fn);

    observer.observe(document.body);
    observer.unobserve(document.body);
    IntersectionObserverMock.intersectElement(document.body, 0.12345);

    expect(fn).not.toHaveBeenCalled();
  });

  it("should stop observing on disconnect", () => {
    const fn = jest.fn();
    const observer = new IntersectionObserverMock(fn);

    observer.observe(document.body);
    observer.disconnect();
    IntersectionObserverMock.intersectElement(document.body, 0.12345);

    expect(fn).not.toHaveBeenCalled();
  });
});
