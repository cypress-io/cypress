<template>
  <button @click="changeText">{{ text }}</button>
</template>

<script>
  export default {
    data() {
      return {
        text: 'Hello'
      }
    },
    methods: {
      changeText() {
        setTimeout(() => {
          this.text = this.text === 'Hello' ? 'Goodbye' : 'Hello'
        }, 1000)
      }
    }
  }
</script>
