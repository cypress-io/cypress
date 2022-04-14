<template>
  <form action="">
    <label for="name">Name</label>
    <input
      id="name"
      v-model="name"
      type="text"
      name="name"
    >
    <label for="email">Email</label>
    <input
      id="email"
      v-model="email"
      type="email"
      name="email"
    >
    <button
      type="submit"
      :disabled="!hasValidFields"
    >
      Submit
    </button>
  </form>
</template>
<script>
export default {
  name: 'AppForm',
  data () {
    return {
      name: '',
      email: '',
    }
  },
  computed: {
    hasValidFields () {
      return Boolean(this.email && this.name)
    },
  },
}
</script>
<style></style>
