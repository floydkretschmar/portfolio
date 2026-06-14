import { expect, test } from "@playwright/test";

const imageUrl = "https://images.example.test/first-load.svg";
const photo = {
  dateWhenTaken: "2026-06-14",
  id: "home-first-load-photo",
  picture: {
    fallback: imageUrl,
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

test("Home keeps skeletons visible while mocked image fixtures are delayed", async ({
  page,
}) => {
  await mockFlickr(page);
  await mockImages(page, 500);

  await page.goto("/");

  await expect(page.getByText(photo.title, { exact: true })).toBeAttached();
  expect(await page.locator(".v-skeleton-loader").count()).toBeGreaterThan(0);
  await expect(page.getByAltText(photo.title, { exact: true })).toBeVisible();
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
