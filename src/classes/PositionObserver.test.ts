import PositionObserver from "./PositionObserver";
import { withFakeTimers } from "../../testUtils/withFakeTimers";
import { waitPromisesResolve } from "../../testUtils/waitPromisesResolve";
import { withMockedProperty } from "../../testUtils/withMockedProperty";
import { withElementMoved } from "../../testUtils/withElementMoved";

const container = document.body.appendChild(document.createElement("div"));
const target = container.appendChild(document.createElement("input"));

describe("class PositionObserver", () => {
  it("should align on target parent scroll", () => {
    const onShouldAlign = jest.fn();
    const observer = new PositionObserver(target, onShouldAlign);

    withElementMoved(target, () => {
      container.dispatchEvent(new Event("scroll"));
    });

    expect(onShouldAlign).toHaveBeenCalledTimes(1);

    observer.dispose();
  });

  it("should align on body scroll", () => {
    const onShouldAlign = jest.fn();
    const observer = new PositionObserver(target, onShouldAlign);

    withElementMoved(target, () => {
      document.body.dispatchEvent(new Event("scroll"));
    });

    expect(onShouldAlign).toHaveBeenCalledTimes(1);

    observer.dispose();
  });

  it("should align on DOM mutations", async () => {
    const onShouldAlign = jest.fn();
    const observer = new PositionObserver(target, onShouldAlign);

    await withElementMoved(target, async () => {
      document.body.appendChild(document.createElement("div"));

      // MutationObserver schedules calls to next macrotask
      // So wait for next two macrotasks to be run
      await waitPromisesResolve();
    });

    expect(onShouldAlign).toHaveBeenCalledTimes(1);

    observer.dispose();
  });

  it("should align every 1 second if it's not possible to follow DOM mutations", () => {
    withFakeTimers(() => {
      withMockedProperty(window, "MutationObserver", null, () => {
        const onShouldAlign = jest.fn();
        const observer = new PositionObserver(target, onShouldAlign);

        withElementMoved(target, () => {
          jest.advanceTimersByTime(1000);
        });

        expect(onShouldAlign).toHaveBeenCalledTimes(1);

        observer.dispose();
      });
    });
  });

  it("should align on window resize", () => {
    const onShouldAlign = jest.fn();
    const observer = new PositionObserver(target, onShouldAlign);

    withElementMoved(target, () => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(onShouldAlign).toHaveBeenCalledTimes(1);

    observer.dispose();
  });

  it("should not align on window resize then element's position did not change", () => {
    const onShouldAlign = jest.fn();
    const observer = new PositionObserver(target, onShouldAlign);

    window.dispatchEvent(new Event("resize"));

    expect(onShouldAlign).not.toHaveBeenCalled();

    observer.dispose();
  });
});
