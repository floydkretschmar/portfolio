class TestResizeObserver {
  disconnect() {}

  observe() {}

  unobserve() {}
}

globalThis.ResizeObserver ??= TestResizeObserver;
