<template>
  <input type="text" class="input" :value="value" v-on:input="input" />
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: "",
    },
  },
  methods: {
    input(event) {
       this.$emit("input", event.target.value)
    },
  },
};
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

