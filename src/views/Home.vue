<template>
  <div class="infinite-scroll-container">
    <InfiniteScrollContainer
      class="infinite-scroll-container"
      @imageSelected="imageSelected"
    ></InfiniteScrollContainer>
    <ImageModal ref="modal"></ImageModal>
  </div>
</template>

<script>
import InfiniteScrollContainer from "@/components/home/InfiniteScrollContainer.vue";
import ImageModal from "@/components/home/ImageModal.vue";

export default {
  name: "HomePage",
  components: {
    InfiniteScrollContainer,
    ImageModal
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
  height: 100%;
}
</style>
