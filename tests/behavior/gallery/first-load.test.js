import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";

import App from "../../../src/App.vue";
import { registerPlugins } from "../../../src/plugins";
import router from "../../../src/router";
import config from "../../../config.js";
import {
  createDeferred,
  createPhotos,
  firstLoadPhoto,
  firstLoadPhotos,
  pageOneResponse,
  pageResponse,
  transparentImage,
} from "./fixtures.js";
import { createSessionCache } from "../../../src/services/session-cache.js";

const fetch = vi.hoisted(() => vi.fn());

const intersectionObservers = [];

class TestIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnected = false;
    this.observedElement = null;
    intersectionObservers.push(this);
  }

  observe(element) {
    this.observedElement = element;
  }

  disconnect() {
    this.disconnected = true;
  }

  intersect(isIntersecting) {
    this.callback([{ isIntersecting, target: this.observedElement }]);
  }
}

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

function fetchResponse(body) {
  return {
    json: () => Promise.resolve(body),
    ok: true,
  };
}

function resolvePageOne() {
  fetch.mockResolvedValue(fetchResponse(pageOneResponse().data));
}

function mockPages(pages) {
  fetch.mockImplementation((requestUrl) => {
    const page = Number(new URL(requestUrl).searchParams.get("page"));
    return Promise.resolve(
      fetchResponse(pageResponse(pages[page], pages.length - 1).data),
    );
  });
}

function requestedPageNumbers() {
  return fetch.mock.calls.map(([requestUrl]) =>
    Number(new URL(requestUrl).searchParams.get("page")),
  );
}

function flickrUrl(page) {
  return `${config.service_base_url}/photos/${config.photoset}?page=${page}&limit=20`;
}

function cacheSnapshot(photos) {
  return {
    finalPageNumber: 1,
    isLoading: false,
    itemList: photos,
    pageCount: 20,
    pageNumber: 2,
  };
}

function cacheAdapter({ now = () => Date.now() } = {}) {
  return createSessionCache({
    now,
    storage: sessionStorage,
    ttlMs: config.cache_ttl_ms,
  });
}

function seedCachedPhotos(photos, options) {
  cacheAdapter(options).write(cacheSnapshot(photos));
}

function visiblePhotoTitles() {
  return Array.from(document.querySelectorAll(".image-container .item img"))
    .map((image) => image.getAttribute("alt"))
    .filter(Boolean);
}

function visibleGalleryImages() {
  return document.querySelectorAll(".image-container .item img.image");
}

function galleryLayout() {
  return document.querySelector('[data-gallery-layout="masonry"]');
}

async function triggerCurrentObserver(isIntersecting) {
  intersectionObservers.at(-1).intersect(isIntersecting);
  await nextFrame();
}

async function mountGallery({ seedStorage, waitForPhoto = true } = {}) {
  window.fetch = fetch;
  window.IntersectionObserver = TestIntersectionObserver;
  window.ResizeObserver = TestResizeObserver;
  intersectionObservers.length = 0;
  sessionStorage.clear();
  seedStorage?.();

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
    delete window.IntersectionObserver;
    delete window.fetch;
    sessionStorage.clear();
    document.body.innerHTML = "";
  });

  it("renders first page photo details and accessible image text", async () => {
    resolvePageOne();

    const app = await mountGallery();

    expect(fetch).toHaveBeenCalledWith(flickrUrl(1));
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

  it("renders raw Flickr photo fields through the gallery snapshot service", async () => {
    fetch.mockResolvedValue(
      fetchResponse({
        data: [
          {
            date: "2026-06-14",
            fallbackUrl: transparentImage,
            fullImageUrl: transparentImage,
            id: "raw-home-photo",
            thumbnailHeight: 320,
            thumbnailUrl: transparentImage,
            title: "Raw Home photo",
            views: 7,
          },
        ],
        totalPages: 1,
      }),
    );

    const app = await mountGallery({ waitForPhoto: false });

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("Raw Home photo");
    });
    expect(document.body.textContent).toContain("2026-06-14");
    expect(document.body.textContent).toContain("Views: 7");
    expect(document.querySelector('img[alt="Raw Home photo"]')).not.toBeNull();
    app.unmount();
  });

  it("shows skeleton cards before a delayed first page resolves", async () => {
    const pageOne = createDeferred();
    fetch.mockReturnValue(pageOne.promise);

    const app = await mountGallery({ waitForPhoto: false });
    const skeletons = document.querySelectorAll(".v-skeleton-loader");

    expect(skeletons.length).toBeGreaterThan(0);
    expect(skeletons[0].style.height).not.toBe("0px");
    expect(document.body.textContent).not.toContain(firstLoadPhoto.title);
    expect(fetch).toHaveBeenCalledWith(flickrUrl(1));

    pageOne.resolve(fetchResponse(pageOneResponse().data));
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(firstLoadPhoto.title);
    });
    app.unmount();
  });

  it("keeps the loading presentation without new error UI when first page fails", async () => {
    fetch.mockRejectedValue(new Error("Flickr unavailable"));

    const app = await mountGallery({ waitForPhoto: false });

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled();
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

  it("recovers from corrupted cached gallery data by requesting a fresh first page", async () => {
    resolvePageOne();

    const app = await mountGallery({
      seedStorage: () => {
        sessionStorage.setItem("home-data", "not json");
      },
    });

    expect(document.body.textContent).toContain(firstLoadPhoto.title);
    expect(fetch).toHaveBeenCalledWith(flickrUrl(1));
    app.unmount();
  });

  it("recovers from incomplete cached gallery data by requesting a fresh first page", async () => {
    resolvePageOne();

    const app = await mountGallery({
      seedStorage: () => {
        sessionStorage.setItem(
          "home-data",
          JSON.stringify({ data: { itemList: [] }, timestamp: Date.now() }),
        );
      },
    });

    expect(document.body.textContent).toContain(firstLoadPhoto.title);
    expect(fetch).toHaveBeenCalledWith(flickrUrl(1));
    app.unmount();
  });

  it("restores valid cached photos without waiting for the first network page", async () => {
    const cachedPhotos = createPhotos("cached-page", 2);
    const app = await mountGallery({
      seedStorage: () => {
        seedCachedPhotos(cachedPhotos);
      },
      waitForPhoto: false,
    });

    expect(visiblePhotoTitles()).toEqual(
      cachedPhotos.map((photo) => photo.title),
    );
    expect(fetch).not.toHaveBeenCalled();
    app.unmount();
  });

  it("ignores expired cached photos and requests a fresh first page", async () => {
    resolvePageOne();

    const app = await mountGallery({
      seedStorage: () => {
        seedCachedPhotos(createPhotos("expired-page", 1), {
          now: () => Date.now() - config.cache_ttl_ms - 1,
        });
      },
    });

    expect(document.body.textContent).toContain(firstLoadPhoto.title);
    expect(fetch).toHaveBeenCalledWith(flickrUrl(1));
    app.unmount();
  });

  it("persists a successful fresh first page through the production cache boundary", async () => {
    resolvePageOne();

    const app = await mountGallery();
    const cached = cacheAdapter().read();

    expect(cached.value.itemList.slice(0, firstLoadPhotos.length)).toEqual(
      firstLoadPhotos.map((photo) => ({ ...photo, alt: photo.title })),
    );
    app.unmount();
  });

  it("appends continued pages once and keeps a partial final page visible", async () => {
    const firstPage = createPhotos("first-page", 20);
    const finalPage = createPhotos("final-page", 3);
    mockPages([undefined, firstPage, finalPage]);

    const app = await mountGallery({ waitForPhoto: false });
    await vi.waitFor(
      () => {
        expect(document.body.textContent).toContain("first-page photo 20");
      },
      { timeout: 1000 },
    );
    await triggerCurrentObserver(true);

    await vi.waitFor(
      () => {
        expect(fetch).toHaveBeenCalledTimes(2);
      },
      { timeout: 1000 },
    );
    await vi.waitFor(
      () => {
        expect(document.body.textContent).toContain("final-page photo 3");
      },
      { timeout: 1000 },
    );

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(flickrUrl(2));
    expect(visiblePhotoTitles()).toEqual([
      ...firstPage.map((photo) => photo.title),
      ...finalPage.map((photo) => photo.title),
    ]);
    expect(galleryLayout()).not.toBeNull();
    expect(
      Array.from(galleryLayout().querySelectorAll("img.image")).map((image) =>
        image.getAttribute("alt"),
      ),
    ).toEqual([
      ...firstPage.map((photo) => photo.title),
      ...finalPage.map((photo) => photo.title),
    ]);
    expect(visibleGalleryImages()).toHaveLength(
      firstPage.length + finalPage.length,
    );

    await triggerCurrentObserver(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(visibleGalleryImages()).toHaveLength(
      firstPage.length + finalPage.length,
    );
    app.unmount();
  }, 15000);

  it("loads continuation pages only from the active intersecting gallery sentinel", async () => {
    const firstPage = createPhotos("observer-first-page", 20);
    const secondPage = createPhotos("observer-second-page", 3);
    const pageTwo = createDeferred();
    fetch.mockImplementation((requestUrl) => {
      const page = Number(new URL(requestUrl).searchParams.get("page"));
      if (page === 2) {
        return pageTwo.promise;
      }

      return Promise.resolve(fetchResponse(pageResponse(firstPage, 2).data));
    });

    const app = await mountGallery({ waitForPhoto: false });
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(
        "observer-first-page photo 20",
      );
    });

    expect(intersectionObservers).toHaveLength(1);

    await triggerCurrentObserver(false);
    expect(requestedPageNumbers()).toEqual([1]);

    await triggerCurrentObserver(true);
    await triggerCurrentObserver(true);
    expect(requestedPageNumbers().filter((page) => page === 2)).toHaveLength(1);

    pageTwo.resolve(fetchResponse(pageResponse(secondPage, 2).data));
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(
        "observer-second-page photo 3",
      );
    });

    await router.push("/about");
    await nextFrame();
    expect(intersectionObservers.at(-1).disconnected).toBe(true);

    await router.push("/");
    await nextFrame();
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(
        "observer-second-page photo 3",
      );
    });

    expect(intersectionObservers).toHaveLength(2);
    await triggerCurrentObserver(true);
    expect(requestedPageNumbers().filter((page) => page === 3)).toHaveLength(0);
    app.unmount();
    expect(intersectionObservers.at(-1).disconnected).toBe(true);
  }, 15000);

  it("ignores repeated continuation triggers while page two is pending", async () => {
    const firstPage = createPhotos("pending-first-page", 20);
    const secondPage = createPhotos("pending-second-page", 3);
    const pageTwo = createDeferred();
    fetch.mockImplementation((requestUrl) => {
      const page = Number(new URL(requestUrl).searchParams.get("page"));
      if (page === 2) {
        return pageTwo.promise;
      }

      return Promise.resolve(fetchResponse(pageResponse(firstPage, 2).data));
    });

    const app = await mountGallery({ waitForPhoto: false });
    await vi.waitFor(
      () => {
        expect(document.body.textContent).toContain(
          "pending-first-page photo 20",
        );
      },
      { timeout: 1000 },
    );

    await triggerCurrentObserver(true);
    await triggerCurrentObserver(true);
    await nextFrame();

    expect(requestedPageNumbers().filter((page) => page === 2)).toHaveLength(1);

    pageTwo.resolve(fetchResponse(pageResponse(secondPage, 2).data));
    await vi.waitFor(
      () => {
        expect(document.body.textContent).toContain(
          "pending-second-page photo 3",
        );
      },
      { timeout: 1000 },
    );
    expect(visiblePhotoTitles()).toEqual([
      ...firstPage.map((photo) => photo.title),
      ...secondPage.map((photo) => photo.title),
    ]);
    app.unmount();
  }, 15000);

  it("clears pending state after a failed continuation load so a future load can proceed without new error UI", async () => {
    const firstPage = createPhotos("recoverable-first-page", 20);
    const secondPage = createPhotos("recoverable-second-page", 3);
    let pageTwoFailed = false;
    fetch.mockImplementation((requestUrl) => {
      const page = Number(new URL(requestUrl).searchParams.get("page"));
      if (page === 2 && !pageTwoFailed) {
        pageTwoFailed = true;
        return Promise.reject(new Error("Flickr unavailable"));
      }

      return Promise.resolve(
        fetchResponse(
          pageResponse(page === 1 ? firstPage : secondPage, 2).data,
        ),
      );
    });

    const app = await mountGallery({ waitForPhoto: false });
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(
        "recoverable-first-page photo 20",
      );
    });

    await triggerCurrentObserver(true);
    await vi.waitFor(() => {
      expect(requestedPageNumbers().filter((page) => page === 2)).toHaveLength(
        1,
      );
    });
    await nextFrame();

    expect(
      document.querySelectorAll(".v-skeleton-loader").length,
    ).toBeGreaterThan(0);
    expect(
      document.querySelector(".v-alert, .v-snackbar, .v-banner, .retry-panel"),
    ).toBeNull();
    expect(document.body.textContent).not.toMatch(
      /error|failed|retry|unavailable/i,
    );

    await triggerCurrentObserver(true);
    await vi.waitFor(
      () => {
        expect(
          requestedPageNumbers().filter((page) => page === 2),
        ).toHaveLength(2);
      },
      { timeout: 1000 },
    );
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(
        "recoverable-second-page photo 3",
      );
    });
    expect(visiblePhotoTitles()).toEqual([
      ...firstPage.map((photo) => photo.title),
      ...secondPage.map((photo) => photo.title),
    ]);
    app.unmount();
  }, 30000);
});
