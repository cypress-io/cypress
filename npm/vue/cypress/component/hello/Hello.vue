<template>
  <p v-if="show">{{ greeting }} World!</p>
</template>

<script>
export default {
  data () {
    return {
      greeting: 'Hello',
      show: true
    }
  },

  created() {
    setTimeout(() => {
      this.show = true
    }, 5000)
  }
}
</script>

<style scoped>
p {
  font-size: 2em;
  text-align: center;
}
</style>
