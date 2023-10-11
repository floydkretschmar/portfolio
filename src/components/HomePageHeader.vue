<template>
  <div class="header-root">
    <header class="header">
      <div class="menu">
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>
      <h1 class="text-centered title">Floyd Kretschmar</h1>
    </header>
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
  // margin:1em 0 0 0;
  padding: 0;
  margin: auto;
  margin-top: 10px;
  text-align: center;
}
.menu li {
  width: 100%;
  // padding:1em;
  padding-bottom: 0.5em;
  // padding-right:0em;
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
    margin-right: 7%;
    margin-left: 5em;
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
