<template>
  <button v-on:click="incrementCounter">{{ counter }}</button>
</template>

<script>
  export default {
    data () {
      return {
        counter: 0
      }
    },

    methods: {
      incrementCounter: function () {
        this.counter += 1
        this.$emit('increment')
      }
    }
  }
</script>

<style scoped>
button {
  margin: 5px 10px;
  padding: 5px 10px;
  border-radius: 3px;
}
</style>
