<template>
  <button @click="handleClick">Alert me</button>
</template>

<script>
  export default {
    name: 'AlertMessage',
    methods: {
      handleClick() {
        alert('Hello Vue')
      }
    }
  }
</script>
