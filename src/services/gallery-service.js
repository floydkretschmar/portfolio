function normalizePhoto(photo) {
  const title = photo.title ?? "";

  return {
    alt: photo.alt ?? title,
    dateWhenTaken: photo.dateWhenTaken ?? photo.date,
    id: photo.id,
    picture: {
      fallback: photo.picture?.fallback ?? photo.fallbackUrl,
      url: photo.picture?.url ?? photo.fullImageUrl,
    },
    thumbnail: {
      height: photo.thumbnail?.height ?? photo.thumbnailHeight,
      url: photo.thumbnail?.url ?? photo.thumbnailUrl,
    },
    title,
    views: photo.views,
  };
}

function createPlaceholder(index) {
  return {
    id: `skeleton-${index}`,
    loaded: false,
    thumbnail: { height: 200 + ((index * 97) % 401) },
  };
}

function createSkeletons(pageSize) {
  return Array.from({ length: pageSize }, (_, index) =>
    createPlaceholder(index),
  );
}

function createLoadingSnapshot({ pageSize, snapshot }) {
  const startIndex = (snapshot.pageNumber - 1) * pageSize;
  if (snapshot.itemList.length > startIndex) {
    return { ...snapshot, isLoading: true };
  }

  return {
    ...snapshot,
    isLoading: true,
    itemList: [...snapshot.itemList, ...createSkeletons(pageSize)],
  };
}

function canLoadMore(snapshot) {
  return (
    snapshot.finalPageNumber === -1 ||
    snapshot.pageNumber <= snapshot.finalPageNumber
  );
}

export function createGalleryService({ cache, flickrClient, pageSize }) {
  let snapshot = {
    canLoadMore: true,
    finalPageNumber: -1,
    isLoading: false,
    itemList: [],
    pageCount: pageSize,
    pageNumber: 1,
  };
  let pending = false;

  return {
    snapshot() {
      return snapshot;
    },
    restore() {
      const cached = cache.read();
      if (cached.value) {
        snapshot = {
          ...cached.value,
          canLoadMore: canLoadMore(cached.value),
          isLoading: false,
        };
        return snapshot;
      }

      snapshot = {
        ...snapshot,
        itemList: createSkeletons(pageSize),
      };
      return snapshot;
    },
    async loadNext() {
      if (pending || !canLoadMore(snapshot)) {
        return snapshot;
      }

      pending = true;
      snapshot = createLoadingSnapshot({ pageSize, snapshot });
      let result;
      try {
        result = await flickrClient.fetchPage(snapshot.pageNumber, pageSize);
      } catch {
        pending = false;
        snapshot = { ...snapshot, isLoading: false };
        return snapshot;
      }

      const photos = result.data.data.map(normalizePhoto);
      const nextPageNumber = snapshot.pageNumber + 1;

      snapshot = {
        finalPageNumber: result.data.totalPages,
        isLoading: false,
        itemList: [
          ...snapshot.itemList.slice(0, (snapshot.pageNumber - 1) * pageSize),
          ...photos,
        ],
        pageCount: pageSize,
        pageNumber: nextPageNumber,
      };
      snapshot = { ...snapshot, canLoadMore: canLoadMore(snapshot) };
      cache.write(snapshot);
      pending = false;
      return snapshot;
    },
  };
}
