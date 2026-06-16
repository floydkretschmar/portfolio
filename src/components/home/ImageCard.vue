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
      <div class="text-white image-info-container">
        <div class="image-info" :class="{ 'on-hover': isHovering }">
          <p class="image-info-title">
            {{ image.title }}
          </p>
          <div class="image-info-meta">
            <span class="image-info-date">
              {{ image.dateWhenTaken }}
            </span>
            <span class="image-info-views"> Views: {{ image.views }} </span>
          </div>
        </div>
      </div>
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
.item {
  break-inside: avoid;
  display: block;
  margin-bottom: var(--gallery-gap, 20px);
  overflow: hidden;
  position: relative;
  width: min(var(--gallery-card-width, 350px), 100%);
}

.v-overlay {
  backdrop-filter: blur(20px);
}

.image {
  display: block;
  width: 100%;
  height: auto;
}

.image-info-container {
  bottom: 0;
  left: 0;
  padding: 0 !important;
  pointer-events: none;
  position: absolute;
  right: 0;
  z-index: 1;
}

.image-info {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.76) 34%,
    rgba(0, 0, 0, 0.86) 100%
  );
  box-sizing: border-box;
  line-height: 1.2;
  opacity: 0;
  padding: 28px 14px 12px;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    visibility 0s linear 0.18s;
  transform: translateY(8px);
  visibility: hidden;
  width: 100%;
}

.image-info.on-hover {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0s;
  visibility: visible;
}

.image-info-title {
  font-size: 0.875rem;
  font-weight: 300;
  line-height: 1.2;
  margin: 0 0 0.45rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-info-meta {
  align-items: center;
  display: flex;
  font-size: 0.75rem;
  font-weight: 300;
  gap: 0.75rem;
  justify-content: space-between;
  line-height: 1.2;
  white-space: nowrap;
}

.image-info-date,
.image-info-views {
  min-width: 0;
}

.image-info-date {
  overflow: hidden;
  text-overflow: ellipsis;
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
