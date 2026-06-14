<template>
  <v-card v-if="!this.loaded" class="item" flat>
    <v-skeleton-loader
      type="image"
      :height="image.thumbnail.height"
    ></v-skeleton-loader>
  </v-card>
  <v-hover v-slot="{ isHovering, props }">
    <v-card :width="loaded ? '' : 0" class="item" flat v-bind="props">
      <img
        @load="loaded = true"
        @error="$event.target.src = image.picture.fallback"
        :src="image.thumbnail.url"
        :alt="image.alt || image.title"
        class="align-end image"
      />
      <v-card-title
        class="text-h7 text-white d-flex flex-column image-info-container"
      >
        <div class="image-info" :class="{ 'on-hover': isHovering }">
          <p>
            {{ image.title }}
          </p>
          <div>
            <p class="text-caption" style="float: left">
              {{ image.dateWhenTaken }}
            </p>
            <p class="text-caption" style="float: right">
              Views: {{ image.views }}
            </p>
          </div>
        </div>
      </v-card-title>
      <v-dialog v-model="dialog" activator="parent" width="auto">
        <v-card v-if="dialog">
          <img
            class="modal-image"
            :src="image.picture.url"
            @error="$event.target.src = image.picture.fallback"
            :alt="image.alt || image.title"
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
      dialog: false,
      loaded: false,
    };
  },
};
</script>

<style lang="scss">
.v-card-title,
.text-caption {
  font-weight: 100 !important;
}

.item {
  break-inside: avoid;
  display: block;
  margin-bottom: var(--gallery-gap, 20px);
  width: min(var(--gallery-card-width, 350px), 100%);
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
