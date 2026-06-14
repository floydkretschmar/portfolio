// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "vue";

import ImageCard from "../../../src/components/home/ImageCard.vue";
import vuetify from "../../../src/plugins/vuetify";
import { imageCardPhoto } from "./fixtures.js";

async function nextFrame() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function mountImageCard(image = imageCardPhoto) {
  window.visualViewport = {
    addEventListener() {},
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    removeEventListener() {},
    width: 1024,
  };
  document.body.innerHTML = '<div id="app"></div>';
  const app = createApp(ImageCard, { image });
  app.use(vuetify);
  app.mount("#app");
  await nextFrame();

  return app;
}

describe("image card", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("uses the fixture fallback when the displayed image fails", async () => {
    const app = await mountImageCard();
    const image = document.querySelector("img.image");

    image.dispatchEvent(new Event("error"));
    await nextFrame();

    expect(image.getAttribute("src")).toBe(imageCardPhoto.picture.fallback);
    app.unmount();
  });

  it("preserves loading, metadata, hover, dialog, close, and modal fallback behavior", async () => {
    const app = await mountImageCard();
    const image = document.querySelector("img.image");

    expect(document.querySelector(".v-skeleton-loader")).not.toBeNull();

    image.dispatchEvent(new Event("load"));
    await nextFrame();

    expect(document.querySelector(".v-skeleton-loader")).toBeNull();
    expect(image.getAttribute("alt")).toBe(imageCardPhoto.title);
    expect(document.body.textContent).toContain(imageCardPhoto.title);
    expect(document.body.textContent).toContain(imageCardPhoto.dateWhenTaken);
    expect(document.body.textContent).toContain(
      `Views: ${imageCardPhoto.views}`,
    );

    const loadedCard = image.closest(".item");
    loadedCard.dispatchEvent(new Event("mouseenter"));
    await nextFrame();

    expect(document.querySelector(".image-info").className).toContain(
      "on-hover",
    );

    loadedCard.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextFrame();

    const modalImage = document.querySelector(".modal-image");
    expect(modalImage.getAttribute("alt")).toBe(imageCardPhoto.title);

    modalImage.dispatchEvent(new Event("error"));
    await nextFrame();

    expect(modalImage.getAttribute("src")).toBe(
      imageCardPhoto.picture.fallback,
    );

    document
      .querySelector(".close-button")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextFrame();

    expect(document.querySelector(".modal-image")).toBeNull();
    expect(document.querySelector("img.image")).not.toBeNull();
    app.unmount();
  });
});
