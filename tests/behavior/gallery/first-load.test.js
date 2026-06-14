// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";

import App from "../../../src/App.vue";
import { registerPlugins } from "../../../src/plugins";
import router from "../../../src/router";
import config from "../../../config.js";
import { createDeferred, firstLoadPhoto, pageOneResponse } from "./fixtures.js";

const axios = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: axios,
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

function resolvePageOne() {
  axios.mockResolvedValue(pageOneResponse());
}

async function mountGallery({ waitForPhoto = true } = {}) {
  window.ResizeObserver = TestResizeObserver;
  sessionStorage.clear();

  document.body.innerHTML = '<div id="app"></div>';
  window.history.pushState({}, "", "/");
  const app = createApp(App);
  registerPlugins(app);
  app.mount("#app");
  await router.isReady();
  await router.push("/");
  await nextFrame();

  if (waitForPhoto) {
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(firstLoadPhoto.title);
    });
  }

  return app;
}

describe("first gallery load", () => {
  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    document.body.innerHTML = "";
  });

  it("renders first page photo details and accessible image text", async () => {
    resolvePageOne();

    const app = await mountGallery();

    expect(document.body.textContent).toContain(firstLoadPhoto.title);
    expect(document.body.textContent).toContain(firstLoadPhoto.dateWhenTaken);
    expect(document.body.textContent).toContain(
      `Views: ${firstLoadPhoto.views}`,
    );
    expect(
      document
        .querySelector(`img[src="${firstLoadPhoto.thumbnail.url}"]`)
        .getAttribute("alt"),
    ).toBe(firstLoadPhoto.title);
    app.unmount();
  });

  it("shows skeleton cards before a delayed first page resolves", async () => {
    const pageOne = createDeferred();
    axios.mockReturnValue(pageOne.promise);

    const app = await mountGallery({ waitForPhoto: false });
    const skeletons = document.querySelectorAll(".v-skeleton-loader");

    expect(skeletons.length).toBeGreaterThan(0);
    expect(skeletons[0].style.height).not.toBe("0px");
    expect(document.body.textContent).not.toContain(firstLoadPhoto.title);
    expect(axios).toHaveBeenCalledWith({
      method: "get",
      params: {
        limit: 20,
        page: 1,
      },
      url: `${config.service_base_url}/photos/${config.photoset}`,
    });

    pageOne.resolve(pageOneResponse());
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(firstLoadPhoto.title);
    });
    app.unmount();
  });

  it("keeps the loading presentation without new error UI when first page fails", async () => {
    axios.mockRejectedValue(new Error("Flickr unavailable"));

    const app = await mountGallery({ waitForPhoto: false });

    await vi.waitFor(() => {
      expect(axios).toHaveBeenCalled();
    });

    expect(
      document.querySelectorAll(".v-skeleton-loader").length,
    ).toBeGreaterThan(0);
    expect(
      document.querySelector(".v-alert, .v-snackbar, .v-banner, .retry-panel"),
    ).toBeNull();
    expect(document.body.textContent).not.toMatch(
      /error|failed|retry|unavailable/i,
    );
    app.unmount();
  });
});
