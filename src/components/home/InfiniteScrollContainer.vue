<template>
  <skeleton-container v-if="this.initialLoad"></skeleton-container>
  <div v-else
      v-masonry
      class="image-container"
      transition-duration="0"
      item-selector=".item"
      :origin-top="true"
      :horizontal-order="false"
      :fit-width="true"
      gutter="20"
    >
      <div class="row">
          <image-card v-for="image in itemList" :key="image.id" :image="image"/> 
      </div>
  </div>
</template>

<script>
import ApiService from "@/services/ApiService.ts";
import ImageCard from "@/components/home/ImageCard.vue";
import SkeletonContainer from "./SkeletonContainer.vue";

const apiService = new ApiService();
export default {
  data: () => ({
    itemList: [],
    pageNumber: 1,
    pageCount: 20,

    endOfPage: false,
    isLoading: false,
    initialLoad: true
  }),
  components: {
    ImageCard,
    SkeletonContainer
},
  created() {
    this.load().then(() => {
      window.addEventListener('scroll', this.handleScroll);
      this.initialLoad = false;
    })
  },
  methods: {
    async handleScroll() {
      let scrollHeight = window.scrollY
      let maxHeight = window.document.body.scrollHeight - window.document.documentElement.clientHeight
      
      if (scrollHeight >= maxHeight - 800) {
        await this.load()
      }
    },
    async load() {
      if (!this.endOfPage && !this.isLoading) {
        this.isLoading = true;
        try {
          const res = await apiService.fetchItemsAPI(this.pageNumber, this.pageCount);
          this.itemList.push(...res.data.data);
          this.pageNumber++;
          this.isLoading = false;
        }
        catch (e) {
          this.endOfPage = true;
        }
      }
    }
  },
}
</script>

<style lang="scss" scoped>
.image-container {
  margin: auto;
  position: relative;
}
</style>