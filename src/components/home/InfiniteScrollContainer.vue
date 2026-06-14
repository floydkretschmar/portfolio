<template>
  <div>
    <div class="image-container" data-gallery-layout="masonry">
      <image-card v-for="image in itemList" :key="image.id" :image="image" />
    </div>
    <div ref="sentinel" class="gallery-sentinel" aria-hidden="true"></div>
  </div>
</template>

<script>
import ImageCard from "@/components/home/ImageCard.vue";
import { createFlickrClient } from "@/services/flickr-client.js";
import { createGalleryService } from "@/services/gallery-service.js";
import { createObserverBoundary } from "@/services/observer-boundary.js";
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
    observerBoundary: null,
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
      this.load();
    }
  },
  mounted() {
    this.observerBoundary = this.createObserverBoundary();
    this.observerBoundary.observe(this.$refs.sentinel);
  },
  beforeUnmount() {
    this.observerBoundary?.disconnect();
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
    createObserverBoundary() {
      return createObserverBoundary({
        IntersectionObserver: window.IntersectionObserver,
        onIntersect: this.requestLoadMore,
        rootMargin: "200px 0px",
      });
    },
    requestLoadMore() {
      if (this.finalPageNumber === -1 || !this.canLoadMore || this.isLoading) {
        return;
      }

      this.isLoading = true;
      this.load();
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
  --gallery-card-width: 350px;
  --gallery-column-count: 1;
  --gallery-gap: 20px;
  column-count: var(--gallery-column-count);
  column-gap: var(--gallery-gap);
  margin: auto;
  width: min(
    calc(
      var(--gallery-card-width) * var(--gallery-column-count) +
        var(--gallery-gap) * (var(--gallery-column-count) - 1)
    ),
    calc(100vw - 40px)
  );
}

@media (min-width: 760px) {
  .image-container {
    --gallery-column-count: 2;
  }
}

@media (min-width: 1130px) {
  .image-container {
    --gallery-column-count: 3;
  }
}

@media (min-width: 1500px) {
  .image-container {
    --gallery-column-count: 4;
  }
}

@media (min-width: 1870px) {
  .image-container {
    --gallery-column-count: 5;
  }
}

.gallery-sentinel {
  block-size: 1px;
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
