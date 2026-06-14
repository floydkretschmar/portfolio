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

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function mockFlickr(page, responseDelay = 0) {
  await page.route(
    "https://flickr-service.fly.dev/photos/**",
    async (route) => {
      if (responseDelay > 0) {
        await delay(responseDelay);
      }

      await route.fulfill({
        contentType: "application/json",
        json: {
          data: photos,
          totalPages: 1,
        },
      });
    },
  );
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
  await expect(page.getByAltText(photo.title)).toBeVisible();
});

test("Home keeps skeletons visible while mocked image fixtures are delayed", async ({
  page,
}) => {
  await mockFlickr(page);
  await mockImages(page, 500);

  await page.goto("/");

  await expect(page.getByText(photo.title)).toBeAttached();
  expect(await page.locator(".v-skeleton-loader").count()).toBeGreaterThan(0);
  await expect(page.getByAltText(photo.title)).toBeVisible();
});
