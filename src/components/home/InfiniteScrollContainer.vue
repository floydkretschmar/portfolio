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
    <div v-if="this.isLoading">
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="700"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="400"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="600"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="440"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="300"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="500"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader type="image" height="800"></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="350"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="500"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="500"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="700"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="200"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader
          type="image"
          height="500"
          v-masonry-tile
        ></v-skeleton-loader>
      </v-card>
      <v-card v-masonry-tile class="item" @click="" flat>
        <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
      </v-card>
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
  },
  methods: {
    async handleScroll() {
      let scrollHeight = window.scrollY;
      let maxHeight =
        window.document.body.scrollHeight -
        window.document.documentElement.clientHeight;

      if (scrollHeight >= maxHeight - 200) {
        if (this.pageNumber <= this.finalPageNumber && !this.isLoading) {
          this.isLoading = true;
          await this.load();
          this.$redrawVueMasonry();
        }
      }
    },
    async load() {
      const res = await apiService.fetchItemsAPI(
        this.pageNumber,
        this.pageCount,
      );

      this.itemList.push(...res.data.data);
      this.pageNumber++;
      this.finalPageNumber = res.data.totalPages;
      this.isLoading = false;
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
