<template>
  <v-hover v-slot="{ isHovering, props }">
    <v-card v-masonry-tile class="item" @click="" flat v-bind="props">
      <img :src="image.thumbnail.url" class="align-end image" />
      <v-card-title
        class="text-h7 text-white d-flex flex-column image-info-container"
      >
        <div class="image-info" :class="{ 'on-hover': isHovering }">
          <p>
            {{ image.title }}
          </p>
          <div>
            <p class="text-caption font-weight-light" style="float: left">
              {{ image.dateWhenTaken }}
            </p>
            <p class="text-caption font-weight-light" style="float: right">
              Views: {{ image.views }}
            </p>
          </div>
        </div>
      </v-card-title>
      <v-dialog v-model="dialog" activator="parent" width="auto">
        <v-card>
          <img
            class="modal-image"
            :src="image.picture.url"
            :alt="image.title"
          />
          <span class="close-button" @click="dialog = false">&times;</span>
        </v-card>
      </v-dialog>
    </v-card>
  </v-hover>
</template>

<script>
export default {
  name: "ImageCard",
  props: ["image"],
  data() {
    return {
      isExpanded: false,
      dialog: false,
    };
  },
};
</script>

<style lang="scss">
.item {
  margin-bottom: 20px;
  width: 300px;
}

@media only screen and (min-width: 1600px) {
  .item {
    margin-bottom: 20px;
    width: 500px;
  }
}

@media only screen and (min-width: 2500px) {
  .item {
    margin-bottom: 20px;
    width: 600px;
  }
}

.v-overlay {
  backdrop-filter: blur(20px);
}

.image {
  width: 100%;
  height: auto;
}

.v-card-title {
  padding: 0 !important;
}

.image-info {
  background: rgba(0, 0, 0, 0.7);
  opacity: 1;
  padding: 0.5em;
  padding-left: 1em;
  padding-right: 1em;
  visibility: hidden;
  opacity: 0;
  transition:
    visibility 0s,
    opacity 0.5s linear;
}

.image-info.on-hover {
  visibility: visible;
  opacity: 1;
}

.image-info-container {
  margin-top: -90px;
}

.modal-image {
  max-width: 95vw;
  max-height: 95vh;
  height: auto;
  width: auto;
}

.close-button {
  position: absolute;
  right: 0.5em;
  top: 0;
  color: #aaa;
  font-size: 60px;
  font-weight: bold;
}

.close-button:hover,
.close-button:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
</style>
