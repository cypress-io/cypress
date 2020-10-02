<template>
  <div>
    <input v-model="username" data-cy="username" />
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
export default {
  name: "Hello",
  data() {
    return {
      username: ""
    };
  },

  computed: {
    error() {
      console.log(this.username);
      return this.username.trim().length < 7
        ? "Please enter a longer username"
        : "";
    }
  }
};
</script>
