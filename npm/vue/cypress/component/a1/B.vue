<template>
  <div>
    <p>{{ msg || greeting }} World! (B)</p>
    <p v-if="show">Done</p>
  </div>
</template>

<script>
export default {
  props: {
    msg: String
  },
  data () {
    return {
      show: false,
      greeting: 'B'
    }
  },
  created() {
    setTimeout(() => {
      this.show = true
    }, 1000)

    setTimeout(() => {
      this.$emit('greeting', `ID: ${(Math.random() * 1000).toFixed()}`)
    }, 200)
  }
}
</script>

<style scoped>
p {
  font-size: 2em;
  text-align: center;
}
</style>
