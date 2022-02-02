<template>
  <input type="text" class="input" :value="value" v-on="listeners" />
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  computed: {
    listeners () {
      return {
        // Pass all component listeners directly to input
        ...this.$listeners,
        // Override input listener to work with v-model
        input: (event) => this.$emit('input', event.target.value),
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import "../variables.scss";

.input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid $vue-blue;
}
</style>
