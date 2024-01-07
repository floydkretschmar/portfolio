<template>
  <div class="d-flex justify-center">
    <div class="about-page">
      <img
        class="me"
        src="https://live.staticflickr.com/65535/53257854551_7310042b82_k.jpg"
      />
      <div class="text-container">
        <div class="header">Welcome.</div>
        <div class="description font-weight-light">
          I'm Floyd, a software developer and hobbyist photographer from
          Regensburg, Germany. I created this website as a technical challenge
          for myself, as well as a way to put my pictures on display. I hope you
          like them.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss">

.about-page {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 90vw;
}

.me {
  min-height: 400px;
  border-radius: 4px;
  max-width: 85vw;
  max-height: calc(100vh - 162px - 2rem);
}

.text-container {
  max-width: 85vw;
  margin-top: 2rem;
  margin-left: 0px;
  margin-bottom: 2rem;
}

.header {
  margin-bottom: 20px;
  font-size: 3rem;
  font-weight: 500;
  color: #222;
}

.description {
  font-size: 1.25rem;
  line-height: 2rem;
  font-weight: 300;
  color: #777;
}

@media only screen and (min-width: 1100px) {
  .text-container {
    margin-top: 0px;
    max-width: 500px;
    margin-left: 3rem;
  }
}
@media only screen and (min-height: 400px) and (min-width: 1100px)  {
  .text-container {
    margin-bottom: 8em;
    align-items: end;
  }
  .about-page {
    align-items: end;
  }
}
</style>
