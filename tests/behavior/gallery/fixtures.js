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

export function pageOneResponse() {
  return {
    data: {
      data: firstLoadPhotos,
      totalPages: 1,
    },
  };
}

export function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}
