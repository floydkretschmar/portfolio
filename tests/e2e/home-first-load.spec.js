import { expect, test } from "@playwright/test";

const imageUrl = "https://images.example.test/first-load.svg";
const displayedFallbackUrl =
  "https://images.example.test/displayed-fallback.svg";
const photo = {
  dateWhenTaken: "2026-06-14",
  id: "home-first-load-photo",
  picture: {
    fallback: displayedFallbackUrl,
    url: imageUrl,
  },
  thumbnail: {
    height: 320,
    url: imageUrl,
  },
  title: "Mocked Home first-load photo",
  views: 42,
};
const photos = [
  photo,
  {
    ...photo,
    id: "home-first-load-photo-2",
    title: "Second mocked Home first-load photo",
  },
];

function createPhotos(prefix, count) {
  return Array.from({ length: count }, (_, index) => ({
    ...photo,
    id: `${prefix}-${index + 1}`,
    title: `${prefix} photo ${index + 1}`,
  }));
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function mockFlickr(page, responseDelay = 0, responsePhotos = photos) {
  await page.route(
    "https://flickr-service.fly.dev/photos/**",
    async (route) => {
      if (responseDelay > 0) {
        await delay(responseDelay);
      }

      await route.fulfill({
        contentType: "application/json",
        json: {
          data: responsePhotos,
          totalPages: 1,
        },
      });
    },
  );
}

async function mockFlickrPages(page, pages, pageTwoDelay = 0) {
  const requests = [];
  let releasePageTwo;

  await page.route(
    "https://flickr-service.fly.dev/photos/**",
    async (route) => {
      const requestUrl = new URL(route.request().url());
      const pageNumber = Number(requestUrl.searchParams.get("page"));
      requests.push(pageNumber);

      if (pageNumber === 2 && pageTwoDelay > 0) {
        releasePageTwo?.();
        await delay(pageTwoDelay);
      }

      await route.fulfill({
        contentType: "application/json",
        json: {
          data: pages[pageNumber],
          totalPages: pages.length - 1,
        },
      });
    },
  );

  return {
    pageTwoPending:
      pageTwoDelay > 0
        ? new Promise((resolve) => {
            releasePageTwo = resolve;
          })
        : Promise.resolve(),
    requests,
  };
}

async function mockImages(page, responseDelay = 0) {
  await page.route(imageUrl, async (route) => {
    if (responseDelay > 0) {
      await delay(responseDelay);
    }

    await route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#111"/></svg>',
      contentType: "image/svg+xml",
    });
  });
  await page.route(displayedFallbackUrl, async (route) => {
    await route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#eee"/></svg>',
      contentType: "image/svg+xml",
    });
  });
}

test("Home renders mocked Flickr photos after the first loading presentation", async ({
  page,
}) => {
  await mockFlickr(page, 300);
  await mockImages(page);

  await page.goto("/");

  expect(await page.locator(".v-skeleton-loader").count()).toBeGreaterThan(0);
  await expect(page.getByAltText(photo.title, { exact: true })).toBeVisible();
});

test("Home photo metadata overlays without changing masonry card height", async ({
  page,
}) => {
  await mockFlickr(page);
  await mockImages(page);

  await page.goto("/");

  const card = page.locator(".item", {
    has: page.getByAltText(photo.title, { exact: true }),
  });
  const image = page.getByAltText(photo.title, { exact: true });
  await expect(image).toBeVisible();

  const cardBefore = await card.boundingBox();
  const imageBefore = await image.boundingBox();
  const hiddenInfoBox = await card.locator(".image-info").boundingBox();

  expect(cardBefore).not.toBeNull();
  expect(imageBefore).not.toBeNull();
  expect(hiddenInfoBox).not.toBeNull();
  expect(
    Math.abs(
      hiddenInfoBox.y +
        hiddenInfoBox.height -
        (imageBefore.y + imageBefore.height),
    ),
  ).toBeLessThanOrEqual(0.25);

  await card.hover();
  await expect(page.getByText(photo.title, { exact: true })).toBeVisible();
  await expect(card.locator(".image-info-title")).toHaveCSS(
    "font-size",
    "14px",
  );
  await expect(card.locator(".image-info-meta")).toHaveCSS("display", "flex");
  await expect(card.locator(".image-info-meta")).toHaveCSS(
    "white-space",
    "nowrap",
  );
  await expect(card.locator(".image-info")).toHaveCSS("opacity", "1");

  const cardAfter = await card.boundingBox();
  const imageAfter = await image.boundingBox();
  const infoBox = await card.locator(".image-info").boundingBox();

  expect(cardBefore).not.toBeNull();
  expect(imageBefore).not.toBeNull();
  expect(cardAfter).not.toBeNull();
  expect(imageAfter).not.toBeNull();
  expect(infoBox).not.toBeNull();
  expect(Math.abs(cardAfter.height - imageAfter.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(cardBefore.height - cardAfter.height)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(infoBox.y + infoBox.height - (imageAfter.y + imageAfter.height)),
  ).toBeLessThanOrEqual(0.25);
});

test("Home keeps skeletons visible while mocked image fixtures are delayed", async ({
  page,
}) => {
  await mockFlickr(page);
  await mockImages(page, 500);

  await page.goto("/");

  await expect(page.getByText(photo.title, { exact: true })).toBeAttached();
  expect(await page.locator(".v-skeleton-loader").count()).toBeGreaterThan(0);
  expect(
    await page.locator(".image-container").evaluate((container) =>
      Array.from(container.children)
        .filter((item) => window.getComputedStyle(item).display !== "none")
        .every(
          (item) =>
            item.querySelector(".v-skeleton-loader") &&
            item.getBoundingClientRect().width > 0,
        ),
    ),
  ).toBe(true);
  await expect(page.getByAltText(photo.title, { exact: true })).toBeVisible();
});

test("Home keeps the dark app background through the full scrollable gallery", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await mockFlickr(page, 0, createPhotos("dark-background", 20));
  await mockImages(page);

  await page.goto("/");

  await expect(page.getByText("dark-background photo 20")).toBeAttached();
  const background = await page.evaluate(() => {
    const app = document.querySelector(".v-application");
    const appBox = app.getBoundingClientRect();

    return {
      app: window.getComputedStyle(app).backgroundColor,
      appHeight: appBox.height,
      body: window.getComputedStyle(document.body).backgroundColor,
      documentHeight: document.documentElement.scrollHeight,
    };
  });

  expect(background.appHeight).toBeGreaterThanOrEqual(
    background.documentHeight - 1,
  );
  expect(background.body).toBe(background.app);

  await context.close();
});

test("Home appends page two once when bottom scrolling repeats during the pending request", async ({
  page,
}) => {
  const pageOne = createPhotos("e2e-first-page", 20);
  const pageTwo = createPhotos("e2e-second-page", 3);
  const flickr = await mockFlickrPages(
    page,
    [undefined, pageOne, pageTwo],
    500,
  );
  await mockImages(page);

  await page.goto("/");

  await expect(page.getByText("e2e-first-page photo 20")).toBeAttached();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await flickr.pageTwoPending;
  expect(
    await page.locator(".image-container .v-skeleton-loader").count(),
  ).toBeGreaterThan(0);
  expect(flickr.requests.filter((pageNumber) => pageNumber === 2)).toHaveLength(
    1,
  );
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(flickr.requests.filter((pageNumber) => pageNumber === 2)).toHaveLength(
    1,
  );

  await expect(page.getByText("e2e-second-page photo 3")).toBeAttached();
  await expect(page.getByAltText("e2e-second-page photo 3")).toBeVisible();
  await expect(
    page.getByText("e2e-first-page photo 1", { exact: true }),
  ).toBeAttached();
  await expect(page.getByText("e2e-second-page photo 1")).toHaveCount(1);
  expect(flickr.requests.filter((pageNumber) => pageNumber === 2)).toHaveLength(
    1,
  );
});

test("Home opens and closes a loaded image dialog without blocking the gallery", async ({
  page,
}) => {
  await mockFlickr(page);
  await mockImages(page);

  await page.goto("/");

  await page.getByAltText(photo.title, { exact: true }).click();

  await expect(page.locator(".modal-image")).toBeVisible();
  await expect(page.locator(".modal-image")).toHaveAttribute(
    "alt",
    photo.title,
  );

  await page.locator(".close-button").click();

  await expect(page.locator(".modal-image")).toHaveCount(0);
  await expect(
    page.getByAltText("Second mocked Home first-load photo"),
  ).toBeVisible();
});

test("Home switches to the displayed image fallback when the loaded image request fails", async ({
  page,
}) => {
  await mockFlickr(page);
  await mockImages(page);
  await page.route(imageUrl, async (route) => {
    await route.abort();
  });

  await page.goto("/");

  await expect(page.getByAltText(photo.title, { exact: true })).toHaveAttribute(
    "src",
    displayedFallbackUrl,
  );
});
