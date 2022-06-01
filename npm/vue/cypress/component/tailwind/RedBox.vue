<template>
  <!-- classes come from tailwindcss -->
  <div
    class="font-sans m-8 p-8 red"
    data-cy="box"
  >
    <h1>{{ greeting }} RedBox</h1>
  </div>
</template>

<script>
export default {
  props: {
    status: {
      default: '',
      type: String,
    },
  },
  computed: {
    greeting () {
      if (this.status) {
        return 'Hello'
      }

      return 'Goodbye'
    },
  },
}
</script>

<style scoped>
.red {
  background-color: red;
}
</style>
