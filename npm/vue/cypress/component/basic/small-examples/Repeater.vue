<template>
  <section>
    <label for="item">Start Typing</label>
    <input
      id="item"
      v-model="item"
      type="text"
    >
    <div>You typed: {{ item }}</div>
  </section>
</template>
<script>
export default {
  data () {
    return {
      item: '',
    }
  },
}
</script>
<style></style>
