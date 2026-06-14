// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";

import App from "../../../src/App.vue";
import { registerPlugins } from "../../../src/plugins";
import router from "../../../src/router";

const fetch = vi.hoisted(() => vi.fn());
const photo = {
  dateWhenTaken: "2026-06-14",
  id: "route-photo",
  picture: {
    fallback:
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  },
  thumbnail: {
    height: 320,
    url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  },
  title: "Route parity gallery photo",
  views: 42,
};
const photos = Array.from({ length: 2 }, (_, index) => ({
  ...photo,
  id: `route-photo-${index}`,
}));

class TestResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

function nextFrame() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function waitForText(text) {
  await vi.waitFor(() => {
    expect(document.body.textContent).toContain(text);
  });
}

async function renderAppAt(path) {
  document.body.innerHTML = '<div id="app"></div>';
  window.history.pushState({}, "", path);
  window.ResizeObserver = TestResizeObserver;

  window.fetch = fetch.mockResolvedValue({
    json: () =>
      Promise.resolve({
        data: photos,
        totalPages: 1,
      }),
    ok: true,
  });

  const app = createApp(App);
  registerPlugins(app);
  app.mount("#app");
  await router.isReady();
  await nextFrame();

  return app;
}

describe("route shell", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete window.fetch;
    document.body.innerHTML = "";
  });

  it("renders Home and About inside the shared shell through app navigation", async () => {
    const app = await renderAppAt("/");

    expect(document.body.textContent).toContain("Floyd Kretschmar");
    await waitForText("Route parity gallery photo");
    expect(
      document.querySelector(".image-container .item img.image"),
    ).not.toBeNull();

    await router.push("/about");

    await waitForText("Welcome.");
    expect(document.body.textContent).toContain("Welcome.");
    expect(document.body.textContent).toContain(
      "software developer and hobbyist photographer",
    );

    await router.push("/");

    expect(document.body.textContent).toContain("Floyd Kretschmar");
    await waitForText("Route parity gallery photo");
    expect(
      document.querySelector(".image-container .item img.image"),
    ).not.toBeNull();

    app.unmount();
  });
});
