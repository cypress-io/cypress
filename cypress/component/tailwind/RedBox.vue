<template>
  <!-- classes come from tailwindcss -->
  <div class="red m-8 p-8 font-sans" data-cy="box">
    <h1>{{ greeting }} RedBox</h1>
  </div>
</template>

<script>
export default {
  props: ["status"],
  computed: {
    greeting: function() {
      if (this.status) {
        return "Hello";
      } else {
        return "Goodbye";
      }
    }
  }
};
</script>

<style scoped>
.red {
  background-color: red;
}
</style>
