/**
 * @typedef {Object} FlickrPhoto
 * @property {string=} alt
 * @property {string=} date
 * @property {string=} dateWhenTaken
 * @property {string=} fallbackUrl
 * @property {string=} fullImageUrl
 * @property {string} id
 * @property {{ fallback?: string, url?: string }=} picture
 * @property {string=} thumbnailUrl
 * @property {number=} thumbnailHeight
 * @property {{ height?: number, url?: string }=} thumbnail
 * @property {string=} title
 * @property {number|string=} views
 */

/**
 * @typedef {Object} GallerySnapshot
 * @property {boolean} canLoadMore
 * @property {number} finalPageNumber
 * @property {boolean} isLoading
 * @property {Array<Object>} itemList
 * @property {number} pageCount
 * @property {number} pageNumber
 */

/**
 * @typedef {Object} GalleryCacheEntry
 * @property {boolean} expired
 * @property {GallerySnapshot|null} value
 */

/**
 * @typedef {Object} GalleryPageResult
 * @property {{ data: FlickrPhoto[], totalPages: number }} data
 */

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

function createSkeletons({ pageSize, placeholder }) {
  return Array.from({ length: pageSize }, (_, index) =>
    placeholder.create(index),
  );
}

function createLoadingSnapshot({ pageSize, placeholder, snapshot }) {
  const startIndex = (snapshot.pageNumber - 1) * pageSize;
  if (snapshot.itemList.length > startIndex) {
    return { ...snapshot, isLoading: true };
  }

  return {
    ...snapshot,
    isLoading: true,
    itemList: [
      ...snapshot.itemList,
      ...createSkeletons({ pageSize, placeholder }),
    ],
  };
}

function canLoadMore(snapshot) {
  return (
    snapshot.finalPageNumber === -1 ||
    snapshot.pageNumber <= snapshot.finalPageNumber
  );
}

/**
 * Creates the DOM-free gallery behavior service.
 *
 * @param {{
 *   cache: { read: Function, write: Function },
 *   flickrClient: { fetchPage: Function },
 *   pageSize: number,
 *   placeholder: { create: Function },
 * }} options
 */
export function createGalleryService({
  cache,
  flickrClient,
  pageSize,
  placeholder,
}) {
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
        itemList: createSkeletons({ pageSize, placeholder }),
      };
      return snapshot;
    },
    async loadNext() {
      if (pending || !canLoadMore(snapshot)) {
        return snapshot;
      }

      pending = true;
      snapshot = createLoadingSnapshot({ pageSize, placeholder, snapshot });
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
