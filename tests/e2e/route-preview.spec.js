import { expect, test } from "@playwright/test";

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

test("production preview serves Home and About routes through the SPA shell", async ({
  page,
}) => {
  await page.route("https://flickr-service.fly.dev/photos/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      json: {
        data: photos,
        totalPages: 1,
      },
    }),
  );

  await page.goto("/about");

  await expect(page.getByText("Floyd Kretschmar")).toBeVisible();
  await expect(page.getByText("Welcome.")).toBeVisible();
  await expect(
    page.getByText(/software developer and hobbyist photographer/),
  ).toBeVisible();

  await page.getByRole("link", { name: "Home" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.locator(".image-container .item img.image")).toBeVisible();

  await page.getByRole("link", { name: "About" }).click();

  await expect(page).toHaveURL("/about");
  await expect(page.getByText("Welcome.")).toBeVisible();
});
