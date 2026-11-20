<template>
  <div>
    <div
      class="image-container"
      data-gallery-layout="masonry"
      :style="{ '--gallery-column-count': columns.length }"
    >
      <div
        v-for="(column, index) in columns"
        :key="index"
        class="gallery-column"
      >
        <image-card v-for="image in column" :key="image.id" :image="image" />
      </div>
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
const columnBreakpoints = [760, 1130, 1500, 1870];

// Places each card in the currently shortest column, so appended cards always
// land at the bottom and earlier cards never move between columns.
function distributeIntoColumns(items, columnCount) {
  const heights = Array(columnCount).fill(0);
  const columns = heights.map(() => []);

  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(item);
    heights[shortest] += item.thumbnail.height;
  }

  return columns;
}

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
  computed: {
    columns() {
      const width = this.$vuetify.display.width;
      const columnCount =
        1 +
        columnBreakpoints.filter((breakpoint) => width >= breakpoint).length;

      return distributeIntoColumns(this.itemList, columnCount);
    },
  },
  created() {
    this.gallery = this.createGallery();
    const data = this.gallery.restore();
    this.applySnapshot(data);

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
      const request = this.gallery.loadNext();
      this.applySnapshot(this.gallery.snapshot());
      const snapshot = await request;
      this.applySnapshot(snapshot);
      return snapshot;
    },
  },
};
</script>

<style lang="scss" scoped>
.image-container {
  --gallery-card-width: 350px;
  --gallery-gap: 20px;
  align-items: flex-start;
  display: flex;
  gap: var(--gallery-gap);
  margin: auto;
  width: min(
    calc(
      var(--gallery-card-width) * var(--gallery-column-count) +
        var(--gallery-gap) * (var(--gallery-column-count) - 1)
    ),
    calc(100vw - 40px)
  );
}

.gallery-column {
  flex: 1;
  min-width: 0;
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
