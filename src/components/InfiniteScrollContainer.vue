<template>
  <div class="scroll-container" ref="scrollContainer">
    <div
      v-masonry
      class="image-container"
      transition-duration="0"
      item-selector=".item"
      :origin-top="true"
      :horizontal-order="false"
      :fit-width="true"
      gutter="20"
    >
      <image-card
        v-for="image in images"
        :key="image.id"
        :image="image"
        @imageSelected="imageSelected"
      />
    </div>
    <div class="sentinel" ref="sentinel"></div>
  </div>
</template>

<script>
import ApiService from "../services/ApiService.ts";
import ImageCard from "@/components/ImageCard";

const apiService = new ApiService();

export default {
  name: "InfiniteScrollContainer",
  components: {
    ImageCard,
  },
  mounted() {
    apiService
      .fetchItemsAPI(this.pageNumber, this.pageCount)
      .then((response) => {
        this.images.push(...response.data.data);
        this.pageNumber++;
        this.$nextTick().then(() => {
          this.setUpInterSectionObserver();
        });
      });
  },
  unmounted() {
    if (this.listEndObserver) {
      this.listEndObserver.disconnect();
    }
  },
  data() {
    return {
      images: [],

      isLoadingMore: false,
      canLoadMore: true,

      pageNumber: 1,
      pageCount: 10,
    };
  },
  methods: {
    setUpInterSectionObserver() {
      let options = {
        root: this.$refs["scrollContainer"],
        margin: "10px",
      };
      this.listEndObserver = new IntersectionObserver(
        this.handleIntersection,
        options,
      );

      this.listEndObserver.observe(this.$refs["sentinel"]);
    },
    handleIntersection([entry]) {
      if (entry.isIntersecting && this.canLoadMore && !this.isLoadingMore) {
        this.loadMore();
      }
    },
    async loadMore() {
      try {
        this.isLoadingMore = true;
        let response = await apiService.fetchItemsAPI(
          this.pageNumber,
          this.pageCount,
        );
        this.pageNumber++;
        this.images.push(...response.data.data);
      } catch (error) {
        console.log("Reached end of page", error);
        this.canLoadMore = false;
      } finally {
        this.isLoadingMore = false;
      }
    },
    imageSelected(image) {
      this.$emit("imageSelected", image);
    },
  },
};
</script>

<style lang="scss" scoped>
.scroll-container {
  overflow-y: scroll;
  -ms-overflow-style: none;
  scrollbar-width: none;
  position: relative;
}

.scroll-container::-webkit-scrollbar {
  display: none;
}

.row {
  position: relative;
  height: inherit;
}

.image-container {
  margin: auto;
  position: relative;
}

.sentinel {
  height: 10px;
  position: relative;
}

.loadingMore {
  text-align: center;
  margin: 1.5rem;
}
</style>
