export function createFlickrClient({ config, fetch }) {
  if (typeof fetch !== "function") {
    throw new TypeError("Flickr client requires a fetch function");
  }

  return {
    async fetchPage(page, limit) {
      const url = new URL(
        `/photos/${config.photoset}`,
        config.service_base_url,
      );
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Flickr request failed with status ${response.status}`);
      }

      return { data: await response.json() };
    },
  };
}
