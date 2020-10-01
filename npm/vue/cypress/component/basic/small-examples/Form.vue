<template>
  <form action="">
    <label for="name">Name</label>
    <input type="text" name="name" id="name" v-model="name" />
    <label for="email">Email</label>
    <input type="email" name="email" id="email" v-model="email" />
    <button type="submit" :disabled="!hasValidFields">Submit</button>
  </form>
</template>
<script>
export default {
  name: 'AppForm',
  data() {
    return {
      name: '',
      email: '',
    };
  },
  computed: {
    hasValidFields() {
      return Boolean(this.email && this.name);
    },
  },
};
</script>
<style></style>
