import { describe, expect, it, vi } from "vitest";

import { createGalleryService } from "../../../src/services/gallery-service.js";

function createEmptyCache() {
  return {
    read() {
      return { expired: false, value: null };
    },
    write() {},
  };
}

function createDeferred() {
  let resolve;
  const promise = new Promise((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe("gallery service", () => {
  it("restores an empty gallery as deterministic renderable skeleton cards", () => {
    const service = createGalleryService({
      cache: createEmptyCache(),
      flickrClient: { fetchPage: vi.fn() },
      pageSize: 3,
    });

    const snapshot = service.restore();

    expect(snapshot).toEqual({
      canLoadMore: true,
      finalPageNumber: -1,
      isLoading: false,
      itemList: [
        {
          id: "skeleton-0",
          loaded: false,
          thumbnail: { height: expect.any(Number) },
        },
        {
          id: "skeleton-1",
          loaded: false,
          thumbnail: { height: expect.any(Number) },
        },
        {
          id: "skeleton-2",
          loaded: false,
          thumbnail: { height: expect.any(Number) },
        },
      ],
      pageCount: 3,
      pageNumber: 1,
    });
    expect(
      snapshot.itemList.every(
        (item) => item.thumbnail.height >= 200 && item.thumbnail.height <= 600,
      ),
    ).toBe(true);
  });

  it("loads the first Flickr page as normalized renderable photo cards", async () => {
    const cache = createEmptyCache();
    const write = vi.spyOn(cache, "write");
    const flickrClient = {
      fetchPage: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              date: "2026-06-14",
              fallbackUrl: "https://images.example.test/fallback.jpg",
              fullImageUrl: "https://images.example.test/full.jpg",
              id: "raw-photo",
              thumbnailHeight: 360,
              thumbnailUrl: "https://images.example.test/thumb.jpg",
              title: "Raw Flickr photo",
              views: "123",
            },
            {
              date: "2026-06-15",
              fallbackUrl: "https://images.example.test/untitled-fallback.jpg",
              fullImageUrl: "https://images.example.test/untitled-full.jpg",
              id: "untitled-raw-photo",
              thumbnailHeight: 240,
              thumbnailUrl: "https://images.example.test/untitled-thumb.jpg",
              views: "0",
            },
          ],
          totalPages: 4,
        },
      }),
    };
    const service = createGalleryService({
      cache,
      flickrClient,
      pageSize: 2,
    });

    service.restore();
    const snapshot = await service.loadNext();

    expect(flickrClient.fetchPage).toHaveBeenCalledWith(1, 2);
    expect(snapshot).toEqual({
      canLoadMore: true,
      finalPageNumber: 4,
      isLoading: false,
      itemList: [
        {
          alt: "Raw Flickr photo",
          dateWhenTaken: "2026-06-14",
          id: "raw-photo",
          picture: {
            fallback: "https://images.example.test/fallback.jpg",
            url: "https://images.example.test/full.jpg",
          },
          thumbnail: {
            height: 360,
            url: "https://images.example.test/thumb.jpg",
          },
          title: "Raw Flickr photo",
          views: "123",
        },
        {
          alt: "",
          dateWhenTaken: "2026-06-15",
          id: "untitled-raw-photo",
          picture: {
            fallback: "https://images.example.test/untitled-fallback.jpg",
            url: "https://images.example.test/untitled-full.jpg",
          },
          thumbnail: {
            height: 240,
            url: "https://images.example.test/untitled-thumb.jpg",
          },
          title: "",
          views: "0",
        },
      ],
      pageCount: 2,
      pageNumber: 2,
    });
    expect(write).toHaveBeenCalledWith(snapshot);
  });

  it("guards repeated loads while a page request is pending", async () => {
    const page = createDeferred();
    const flickrClient = {
      fetchPage: vi
        .fn()
        .mockReturnValueOnce(page.promise)
        .mockResolvedValueOnce({ data: { data: [], totalPages: 1 } }),
    };
    const service = createGalleryService({
      cache: createEmptyCache(),
      flickrClient,
      pageSize: 2,
    });
    const restored = service.restore();

    const pending = service.loadNext();
    const guarded = await service.loadNext();

    expect(flickrClient.fetchPage).toHaveBeenCalledTimes(1);
    expect(guarded).toMatchObject({
      isLoading: true,
      itemList: restored.itemList,
    });

    page.resolve({ data: { data: [], totalPages: 1 } });
    await pending;
  });

  it("exposes appended skeleton cards while a continuation page is pending", async () => {
    const pageTwo = createDeferred();
    const flickrClient = {
      fetchPage: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            data: [
              {
                id: "first-page-photo",
                thumbnail: {
                  height: 320,
                  url: "https://images.example.test/first-thumb.jpg",
                },
                title: "First page photo",
              },
            ],
            totalPages: 2,
          },
        })
        .mockReturnValueOnce(pageTwo.promise),
    };
    const service = createGalleryService({
      cache: createEmptyCache(),
      flickrClient,
      pageSize: 1,
    });

    service.restore();
    await service.loadNext();
    const pending = service.loadNext();

    expect(service.snapshot()).toMatchObject({
      isLoading: true,
      itemList: [
        { id: "first-page-photo" },
        {
          id: "skeleton-0",
          loaded: false,
          thumbnail: { height: expect.any(Number) },
        },
      ],
      pageNumber: 2,
    });

    pageTwo.resolve({ data: { data: [], totalPages: 2 } });
    await pending;
  });

  it("preserves the visible failed-load snapshot and allows a later load", async () => {
    const cache = createEmptyCache();
    const write = vi.spyOn(cache, "write");
    const flickrClient = {
      fetchPage: vi
        .fn()
        .mockRejectedValueOnce(new Error("Flickr unavailable"))
        .mockResolvedValueOnce({
          data: {
            data: [
              {
                id: "recovered-photo",
                picture: {
                  fallback: "https://images.example.test/fallback.jpg",
                  url: "https://images.example.test/full.jpg",
                },
                thumbnail: {
                  height: 320,
                  url: "https://images.example.test/thumb.jpg",
                },
                title: "Recovered photo",
              },
            ],
            totalPages: 1,
          },
        }),
    };
    const service = createGalleryService({
      cache,
      flickrClient,
      pageSize: 1,
    });
    const restored = service.restore();

    await expect(service.loadNext()).resolves.toMatchObject({
      isLoading: false,
      itemList: restored.itemList,
      pageNumber: 1,
    });
    expect(write).not.toHaveBeenCalled();

    const recovered = await service.loadNext();

    expect(flickrClient.fetchPage).toHaveBeenCalledTimes(2);
    expect(recovered.itemList).toEqual([
      {
        alt: "Recovered photo",
        dateWhenTaken: undefined,
        id: "recovered-photo",
        picture: {
          fallback: "https://images.example.test/fallback.jpg",
          url: "https://images.example.test/full.jpg",
        },
        thumbnail: {
          height: 320,
          url: "https://images.example.test/thumb.jpg",
        },
        title: "Recovered photo",
        views: undefined,
      },
    ]);
  });

  it("restores valid cached photos without requesting a fresh page", () => {
    const cachedSnapshot = {
      finalPageNumber: 1,
      itemList: [
        {
          alt: "Cached photo",
          id: "cached-photo",
          picture: {
            fallback: "https://images.example.test/fallback.jpg",
            url: "https://images.example.test/full.jpg",
          },
          thumbnail: {
            height: 320,
            url: "https://images.example.test/thumb.jpg",
          },
          title: "Cached photo",
        },
      ],
      pageCount: 1,
      pageNumber: 2,
    };
    const flickrClient = { fetchPage: vi.fn() };
    const service = createGalleryService({
      cache: {
        read() {
          return { expired: false, value: cachedSnapshot };
        },
        write() {},
      },
      flickrClient,
      pageSize: 1,
    });

    expect(service.restore()).toEqual({
      ...cachedSnapshot,
      canLoadMore: false,
      isLoading: false,
    });
    expect(flickrClient.fetchPage).not.toHaveBeenCalled();
  });
});
