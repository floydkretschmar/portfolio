<template>
  <div class="header-root">
      <div class="menu">
        <ul>
          <li class="text-h5 font-weight-light"><router-link to="/">Home</router-link></li>
          <li class="text-h5 font-weight-light"><router-link to="/about">About</router-link></li>
        </ul>
      </div>
      <div class="text-h3 text-centered title font-weight-bold">Floyd Kretschmar</div>
  </div>
</template>

<script>
export default {
  name: "SiteHeader",
};
</script>

<style lang="scss">
.header-root {
  padding-top: 1.3em;
  padding-bottom: 1em;
  padding-left: 2em;
  padding-right: 2em;
  margin-bottom: 0;
}

.menu ul {
  padding: 0;
  margin: auto;
  text-align: center;
}
.menu li {
  width: 100%;
  padding-bottom: 0.5em;
  display: block;
  list-style: none;
  text-align: center;
  font-size: larger;
}
.menu li a {
  color: #777;
  text-decoration: none;
  text-transform: uppercase;
}
.title {
  text-align: center;
}

@media only screen and (min-width: 1024px) {
  .menu {
    float: right;
    margin-right: 10em;
    margin-left: 10em;
    margin-top: 14px;
  }
  .menu li {
    display: inline;
    padding-left: 2em;
  }
  .title {
    margin: auto;
    text-align: right;
  }
}
</style>
