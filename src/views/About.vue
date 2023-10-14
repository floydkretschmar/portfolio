<template>
  <v-container class="d-flex justify-center">
    <div class="about-page">
      <img
        class="me"
        src="https://live.staticflickr.com/65535/53257854551_7310042b82_k.jpg"
      />
      <div class="text-container">
        <div class="header text-h2">Welcome.</div>
        <div class="description text-h6 font-weight-light">
          I'm Floyd, a software developer and hobbyist photographer from
          Regensburg, Germany. I created this website as a technical challenge
          for myself, as well as a way to put my pictures on display. I hope you
          like them.
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup></script>

<style lang="scss">
.v-container {
  justify-content: center;
  padding: 0 !important;
  width: 65% !important;
}

.about-page {
  display: flex;
  flex-wrap: wrap;
  max-width: 90vw;
}

.me {
  display: flex;
  align-self: center;
  border-radius: 4px;
  max-width: 85vw;
  max-height: calc(100vh - 102.8px);
}

.text-container {
  align-self: flex-end;
  width: 100%;
  max-width: 85vw;
  margin-top: 2em;
  margin-bottom: 10em;
}

.header {
  margin-bottom: 20px;
}

@media only screen and (min-width: 1100px) {
  .v-container {
    justify-content: left !important;
    padding: 0 !important;
    width: 75% !important;
  }

  .about-page {
    width: 1400px;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
  }
  .text-container {
    margin-top: 0;
  }

  .me {
    margin-top: 0 !important;
    margin-right: 4em;
    height: auto;
    width: auto;
  }
}
</style>
