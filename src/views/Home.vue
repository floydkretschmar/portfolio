<template>
  <div class="infinite-scroll-container">
    <InfiniteScrollContainer
      class="infinite-scroll-container"
    ></InfiniteScrollContainer>
  </div>
</template>

<script>
import InfiniteScrollContainer from "@/components/home/InfiniteScrollContainer.vue";

export default {
  name: "HomePage",
  components: {
    InfiniteScrollContainer
  }
};
</script>

<style lang="scss">
.infinite-scroll-container {
  height: 100%;
}
</style>
