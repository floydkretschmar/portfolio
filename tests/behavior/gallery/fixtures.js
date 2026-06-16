export const transparentImage =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export const firstLoadPhoto = {
  dateWhenTaken: "2026-06-14",
  id: "first-load-photo",
  picture: {
    fallback: transparentImage,
    url: transparentImage,
  },
  thumbnail: {
    height: 320,
    url: transparentImage,
  },
  title: "Accessible first-load photo",
  views: 42,
};

export const firstLoadPhotos = [
  firstLoadPhoto,
  { ...firstLoadPhoto, id: "first-load-photo-2" },
];

export const imageCardPhoto = {
  ...firstLoadPhoto,
  thumbnail: {
    height: 320,
    url: "https://images.example.test/displayed-image.svg",
  },
};

export function createPhotos(prefix, count) {
  return Array.from({ length: count }, (_, index) => ({
    ...firstLoadPhoto,
    id: `${prefix}-${index + 1}`,
    title: `${prefix} photo ${index + 1}`,
  }));
}

export function pageOneResponse() {
  return {
    data: {
      data: firstLoadPhotos,
      totalPages: 1,
    },
  };
}

export function pageResponse(photos, totalPages) {
  return {
    data: {
      data: photos,
      totalPages,
    },
  };
}

export function createDeferred() {
  let resolve;
  const promise = new Promise((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}
