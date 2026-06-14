export function createObserverBoundary({
  IntersectionObserver,
  onIntersect,
  rootMargin = "0px",
}) {
  let observer = null;

  return {
    observe(element) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            onIntersect();
          }
        },
        { rootMargin },
      );
      observer.observe(element);
    },
    disconnect() {
      observer?.disconnect();
      observer = null;
    },
  };
}
