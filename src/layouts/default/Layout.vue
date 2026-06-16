<template>
  <v-app>
    <page-header />

    <content-host />
  </v-app>
</template>

<script setup>
import PageHeader from "./PageHeader.vue";
import ContentHost from "./ContentHost.vue";
</script>

<style>
html,
body,
#app {
  min-height: 100%;
}

#app {
  min-height: 100vh;
  font-family: Poppins, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
  background-color: #fff;
}

.v-application {
  min-height: 100vh;
}
.v-application__wrap {
  min-height: 100vh;
}

body {
  background-color: #fff;
  margin: 0;
}

@media (prefers-color-scheme: dark) {
  body,
  #app {
    background-color: #121212;
  }
}
</style>
