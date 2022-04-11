<template>
  <section>
    <label for="item">Start Typing</label>
    <input type="text" v-model="item" id="item" />
    <div>You typed: {{ item }}</div>
  </section>
</template>
<script>
export default {
  data() {
    return {
      item: '',
    };
  },
};
</script>
<style></style>
