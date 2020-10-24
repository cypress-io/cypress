<template>
  <div @click="changeText">
    <h1>Hello World!</h1>
    <button data-testid="byeButton" :key="random">{{ text }}</button>
  </div>
</template>

<script lang="js">
  export default {
    data() {
      return {
        text: 'Hello',
        random: 0
      }
    },
    methods: {
      changeText() {
        setTimeout(() => {
          this.text = this.text === 'Hello' ? 'Goodbye' : 'Hello'
        }, 1)
      }
    },
    created() {
      // setInterval(() => {
      //   this.random = this.random + 1
      // }, 10)
    }
  }
</script>
