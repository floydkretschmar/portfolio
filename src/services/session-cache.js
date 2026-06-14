const cacheKey = "home-data";

function hasGallerySnapshotShape(data) {
  return (
    data &&
    Array.isArray(data.itemList) &&
    Number.isInteger(data.pageNumber) &&
    Number.isInteger(data.finalPageNumber) &&
    Number.isInteger(data.pageCount)
  );
}

export function createSessionCache({ now, storage, ttlMs }) {
  return {
    read() {
      const item = storage.getItem(cacheKey);
      if (!item) {
        return { expired: false, value: null };
      }

      let entry;
      try {
        entry = JSON.parse(item);
      } catch {
        storage.removeItem(cacheKey);
        return { expired: false, value: null };
      }
      if (
        !entry ||
        typeof entry.timestamp !== "number" ||
        !hasGallerySnapshotShape(entry.data)
      ) {
        storage.removeItem(cacheKey);
        return { expired: false, value: null };
      }

      if (now() >= entry.timestamp + ttlMs) {
        storage.removeItem(cacheKey);
        return { expired: true, value: null };
      }

      return { expired: false, value: entry.data };
    },
    remove() {
      storage.removeItem(cacheKey);
    },
    write(value) {
      storage.setItem(
        cacheKey,
        JSON.stringify({ data: value, timestamp: now() }),
      );
    },
  };
}
