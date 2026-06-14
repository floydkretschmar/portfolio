<template>
  <div
    v-masonry
    class="image-container"
    transition-duration="0"
    item-selector=".item"
    :origin-top="true"
    :horizontal-order="true"
    :fit-width="true"
    gutter="20"
  >
    <div class="row">
      <image-card v-for="image in itemList" :key="image.id" :image="image" />
    </div>
  </div>
</template>

<script>
import ImageCard from "@/components/home/ImageCard.vue";
import { createFlickrClient } from "@/services/flickr-client.js";
import { createGalleryService } from "@/services/gallery-service.js";
import { createSessionCache } from "@/services/session-cache.js";
import config from "../../../config.js";

const flickrClient = createFlickrClient({
  config,
  fetch: (...args) => window.fetch(...args),
});
export default {
  data: () => ({
    canLoadMore: true,
    finalPageNumber: -1,
    gallery: null,
    isLoading: false,
    itemList: [],
  }),
  components: {
    ImageCard,
  },
  created() {
    this.gallery = this.createGallery();
    const data = this.gallery.restore();
    this.applySnapshot(data);

    // cache was empty or freshly invalidated -> treat as new page load
    if (data.finalPageNumber === -1) {
      this.load().then(() => {
        window.addEventListener("scroll", this.handleScroll);
      });
    }
    // restore cached data and add window handler
    else {
      window.addEventListener("scroll", this.handleScroll);
    }
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    applySnapshot(snapshot) {
      this.canLoadMore = snapshot.canLoadMore;
      this.finalPageNumber = snapshot.finalPageNumber;
      this.isLoading = snapshot.isLoading;
      this.itemList = snapshot.itemList;
    },
    cache() {
      return createSessionCache({
        now: Date.now,
        storage: sessionStorage,
        ttlMs: config.cache_ttl_ms,
      });
    },
    createGallery() {
      return createGalleryService({
        cache: this.cache(),
        flickrClient,
        pageSize: config.gallery_page_size,
        placeholder: {
          create: (index) => ({
            id: `skeleton-${index}`,
            loaded: false,
            thumbnail: {
              // Do some random height between 200 and 700 for the image skeleton loader
              height: 400 + this.generateRandomInteger(-200, 200),
            },
          }),
        },
      });
    },
    async handleScroll() {
      let scrollHeight = window.scrollY;
      let maxHeight =
        window.document.body.scrollHeight -
        window.document.documentElement.clientHeight;

      if (
        scrollHeight >= maxHeight - 200 &&
        this.finalPageNumber !== -1 &&
        this.canLoadMore &&
        !this.isLoading
      ) {
        this.isLoading = true;
        this.load().then(() => {
          this.$redrawVueMasonry();
        });
      }
    },
    async load() {
      const snapshot = await this.gallery.loadNext();
      this.applySnapshot(snapshot);
      return snapshot;
    },
    generateRandomInteger(min, max) {
      return Math.floor(min + Math.random() * (max - min + 1));
    },
  },
};
</script>

<style lang="scss" scoped>
.image-container {
  margin: auto;
  position: relative;
}

::v-deep(.v-skeleton-loader) > * {
  height: 100%;
  display: flex;
  flex-direction: column;
}

::v-deep(.v-skeleton-loader .v-skeleton-loader__bone) {
  flex-grow: 1;
}
</style>
