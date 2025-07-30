<template>
  <!-- <skeleton-container v-if="this.initialLoad"></skeleton-container> -->
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
import ApiService from "@/services/ApiService.ts";
import ImageCard from "@/components/home/ImageCard.vue";

const apiService = new ApiService();
export default {
  data: () => ({
    itemList: [],
    pageNumber: 1,
    finalPageNumber: -1,
    pageCount: 20,

    isLoading: false,
  }),
  components: {
    ImageCard,
  },
  created() {
    this.isLoading = true;
    this.load().then(() => {
      window.addEventListener("scroll", this.handleScroll);
    });
    this.addSkeletonImagesToList();
  },
  methods: {
    async handleScroll() {
      let scrollHeight = window.scrollY;
      let maxHeight =
        window.document.body.scrollHeight -
        window.document.documentElement.clientHeight;

      if (
        scrollHeight >= maxHeight - 200 &&
        this.pageNumber <= this.finalPageNumber &&
        !this.isLoading
      ) {
        this.isLoading = true;
        this.load().then(() => {
          this.$redrawVueMasonry();
        });
        this.addSkeletonImagesToList();
      }
    },
    async load() {
      const res = await apiService.fetchItemsAPI(
        this.pageNumber,
        this.pageCount,
      );

      const startIndex = (this.pageNumber - 1) * this.pageCount;
      const endIndex = this.pageNumber * this.pageCount;
      for (
        let currentIndex = startIndex;
        currentIndex < endIndex;
        currentIndex++
      ) {
        const currentRelativeIndex = currentIndex - startIndex;

        if (currentRelativeIndex < res.data.data.length) {
          this.itemList[currentIndex] = res.data.data[currentRelativeIndex];
        } else {
          this.itemList = this.itemList.splice(0, currentIndex - 1);
          break;
        }
      }
      this.pageNumber++;
      this.finalPageNumber = res.data.totalPages;
      this.isLoading = false;
    },
    generateRandomInteger(min, max) {
      return Math.floor(min + Math.random() * (max - min + 1));
    },
    addSkeletonImagesToList() {
      for (let i = 0; i < this.pageCount; i++) {
        this.itemList.push({
          loaded: false,
          thumbnail: {
            // Do some random height between 200 and 700 for the image skeleton loader
            height: 400 + this.generateRandomInteger(-200, 200),
          },
        });
      }
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
