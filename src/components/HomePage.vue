<template>
  <div class="infinite-scroll-container">
    <HomePageHeader></HomePageHeader>
    <InfiniteScrollContainer
      class="infinite-scroll-container"
      @imageSelected="imageSelected"
    ></InfiniteScrollContainer>
    <ImageModal ref="modal"></ImageModal>
  </div>
</template>

<script>
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import ImageModal from "@/components/ImageModal";
import HomePageHeader from "@/components/HomePageHeader";

export default {
  name: "HomePage",
  components: {
    InfiniteScrollContainer,
    ImageModal,
    HomePageHeader,
  },
  methods: {
    imageSelected(image) {
      this.$refs.modal.openImage(image);
    },
  },
};
</script>

<style lang="scss">
.infinite-scroll-container {
  height: 97%;
}
</style>
