<template>
  <div class="wrapper">
    <input v-model="username" />
    <div v-if="error" class="error">{{ error }}</div>
    <img src="./logo.png" />
    <Card/>
  </div>
</template>

<script>
import Card from '../Card/Card.vue'

export default {
  name: 'Hello',
  components: { Card },
  data () {
    return {
      username: '',
    }
  },

  computed: {
    error () {
      console.log(this.username)

      return this.username.trim().length < 7
        ? 'Please enter a longer username'
        : ''
    },
  },
}
</script>

<style scoped>
.wrapper {
  background: hotpink;
  padding: 30px;
  text-align: center;
}

input {
  display: block;
  margin: 20px auto;
}
img {
  width: 50px;
}
</style>
