import { describe, expect, it } from "vitest";

import { createSessionCache } from "../../../src/services/session-cache.js";

function createStorage() {
  const items = new Map();

  return {
    getItem(key) {
      return items.get(key) ?? null;
    },
    removeItem(key) {
      items.delete(key);
    },
    setItem(key, value) {
      items.set(key, value);
    },
  };
}

describe("session cache", () => {
  it("writes and reads a cache entry through the public adapter contract", () => {
    const cache = createSessionCache({
      now: () => 1000,
      storage: createStorage(),
      ttlMs: 500,
    });
    const snapshot = {
      finalPageNumber: 3,
      itemList: [{ id: "cached-photo" }],
      pageCount: 20,
      pageNumber: 2,
    };

    cache.write(snapshot);

    expect(cache.read()).toEqual({ expired: false, value: snapshot });
  });

  it("returns recoverable empty state when storage contains invalid JSON", () => {
    const cache = createSessionCache({
      now: () => 1000,
      storage: {
        getItem() {
          return "not json";
        },
        removeItem() {},
        setItem() {},
      },
      ttlMs: 500,
    });

    expect(cache.read()).toEqual({ expired: false, value: null });
  });

  it("returns recoverable empty state when snapshot data is incomplete", () => {
    const storage = createStorage();
    storage.setItem(
      "home-data",
      JSON.stringify({ data: { itemList: [] }, timestamp: 1000 }),
    );
    const cache = createSessionCache({
      now: () => 1000,
      storage,
      ttlMs: 500,
    });

    expect(cache.read()).toEqual({ expired: false, value: null });
    expect(storage.getItem("home-data")).toBeNull();
  });

  it("removes a cache entry through the public adapter contract", () => {
    const cache = createSessionCache({
      now: () => 1000,
      storage: createStorage(),
      ttlMs: 500,
    });
    cache.write({
      finalPageNumber: 3,
      itemList: [{ id: "cached-photo" }],
      pageCount: 20,
      pageNumber: 2,
    });

    cache.remove();

    expect(cache.read()).toEqual({ expired: false, value: null });
  });

  it("reports expired entries using TTL metadata owned by the cache boundary", () => {
    const storage = createStorage();
    const cache = createSessionCache({
      now: () => 1000,
      storage,
      ttlMs: 500,
    });
    cache.write({
      finalPageNumber: 3,
      itemList: [{ id: "cached-photo" }],
      pageCount: 20,
      pageNumber: 2,
    });

    expect(
      createSessionCache({
        now: () => 1500,
        storage,
        ttlMs: 499,
      }).read(),
    ).toEqual({ expired: true, value: null });
  });
});
