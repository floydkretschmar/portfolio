<template>
  <div class="header-root">
    <div class="text-centered title font-weight-bold">
      Floyd Kretschmar
    </div>
    <div class="menu">
      <ul>
        <li>
          <router-link to="/">Home</router-link>
        </li>
        <li>
          <router-link to="/about">About</router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "SiteHeader",
};
</script>

<style lang="scss">
.header-root {
  padding: 3rem 2rem;
  margin-bottom: 0;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: baseline;
}
.about {
  font-size: 1.6rem;
  font-weight: 300;
}

.about a {
  color: #777;
  text-decoration: none;
}

.menu ul {
  padding-top: 0.5em;
  width: 100%;
  margin: auto;
  text-align: center;
}
.menu li {
  padding: 0 1em;
  font-size: 1.25rem;
  display: inline;
  list-style: none;
  text-align: center;
}
.menu li a {
  color: #777;
  text-decoration: none;
}
.title {
  width: 100%;
  text-align: center;
  font-size: 2rem;
  color: #222;
}

@media only screen and (min-width: 1100px) {
  .header-root {
    padding: 3rem 2rem;
  }
  .menu li {
    padding: 0 1em;
    font-size: 1.6rem;
    font-weight: 300;
  }
  .title {
    font-size: 2.75rem;
    width: auto;
    text-align: right;
  }
  .menu ul {
    margin-left: 2rem;
    padding-top: 1em;
  }
}
</style>
