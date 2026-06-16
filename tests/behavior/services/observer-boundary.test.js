import { describe, expect, it, vi } from "vitest";

import { createObserverBoundary } from "../../../src/services/observer-boundary.js";

describe("observer boundary", () => {
  it("requests work only when the observed target intersects and disconnects the native observer", () => {
    const target = document.createElement("div");
    const requestWork = vi.fn();
    let callback;
    let observer;

    class TestIntersectionObserver {
      constructor(observerCallback, options) {
        callback = observerCallback;
        this.disconnect = vi.fn();
        this.observe = vi.fn();
        this.options = options;
        observer = this;
      }
    }

    const boundary = createObserverBoundary({
      IntersectionObserver: TestIntersectionObserver,
      onIntersect: requestWork,
      rootMargin: "200px 0px",
    });

    boundary.observe(target);
    callback([{ isIntersecting: false, target }]);
    callback([{ isIntersecting: true, target }]);
    boundary.disconnect();

    expect(observer.observe).toHaveBeenCalledWith(target);
    expect(observer.options).toEqual({ rootMargin: "200px 0px" });
    expect(requestWork).toHaveBeenCalledTimes(1);
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });
});
