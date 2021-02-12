<template>
  <div id="app">
    <Nav>
      <h3>Component Testing with Crosswords</h3>
    </Nav>

    <main>
      <router-view class="router-view"/>
    </main>
  </div>
</template>

<script>
  import Nav from './components/Nav'

  export default {
    components: { Nav },
    created() {
      console.log(this.$store, this.$router)
    },
  }
</script>
<style lang="scss">
body {
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

main {
  margin: 0 auto;
  overflow: unset;
}

.router-view {
  margin: 0 auto;
}
</style>
