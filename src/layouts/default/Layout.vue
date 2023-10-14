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
#app {
  height: 100vh;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  -ms-box-sizing: border-box;
  -o-box-sizing: border-box;
  box-sizing: border-box;
  background-color: #fff;
}

.v-application {
  height: 100vh;
}
.v-application__wrap {
  height: 100vh;
}

body {
  margin: 0;
}
</style>
