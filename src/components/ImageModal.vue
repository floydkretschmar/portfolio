<template>
  <div v-if="selectedImage" class="modal" v>
    <span class="close-button" @click="close()">&times;</span>
    <img
      class="modal-content"
      :src="selectedImage.picture.url"
      :alt="selectedImage.title"
    />
  </div>
</template>

<script>
export default {
  name: "ImageModal",
  data() {
    return {
      selectedImage: null,
    };
  },
  created() {
    window.addEventListener("keydown", (e) => {
      if (e.key == "Escape") {
        this.close();
      }
    });
  },
  methods: {
    openImage(image) {
      this.selectedImage = image;
    },
    close() {
      this.selectedImage = null;
    },
  },
};
</script>

<style lang="scss">
.modal {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
  backdrop-filter: blur(20px);
}

.modal-content {
  transform: translate(-50%, -50%);
  position: relative;
  left: 50%;
  top: 50%;
  max-width: 90%;
  max-height: 90%;
  height: auto;
  width: auto;
}

.close-button {
  color: #aaa;
  float: right;
  font-size: 60px;
  font-weight: bold;
  margin-right: 1rem;
}

.close-button:hover,
.close-button:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
</style>
