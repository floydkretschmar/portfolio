<template>
  <div class="item" v-masonry-tile @click="onClick()">
    <img class="image" :src="image.thumbnail.url" :alt="image.title" />
    <div class="body">
      <p v-if="image.title" class="image-title">{{ image.title }}</p>
      <p v-else class="image-title">No Title Found</p>

      <section class="image-date-view-wrapper">
        <p class="image-date">{{ image.dateWhenTaken }}</p>
        <p class="image-views">Views: {{ image.views }}</p>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: "ImageCard",
  props: ["image"],
  data() {
    return {
      isExpanded: false,
    };
  },
  methods: {
    onClick() {
      this.isExpanded = !this.isExpanded;
      this.$emit("imageSelected", this.image);
    },
  },
};
</script>

<style lang="scss">
.item {
  margin-bottom: 20px;
  width: 450px;
}

.item a {
  text-decoration: none;
}

.item:hover .body {
  visibility: visible;
  opacity: 1;
}

.image {
  width: 100%;
  height: auto;
}

.body {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 15px;
  position: relative;
  height: 58px;
  margin: -77px 0 0 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  visibility: hidden;
  opacity: 0;
  transition:
    visibility 0s,
    opacity 0.5s linear;
}

.image-title {
  font-weight: bold;
  font-size: medium;
  margin: 0;
}

.image-owner {
  margin-top: 0;
  font-size: 0.8rem;
}

.image-title,
.image-owner {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.image-date-view-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.image-date,
.image-views {
  margin-bottom: 0;
  font-size: 0.8rem;
}
</style>
