<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["click"],
  props: {
    variant: {
      type: String as () => "wide" | "operator" | "dark",
      default: null,
      validator: (val: string) => ["wide", "operator", "dark"].includes(val),
    },
    value: {
      type: String,
      required: true,
    },
  },
});
</script>

<template>
  <button @click="$emit('click', value)" :class="variant">
    {{ value }}
  </button>
</template>

<style scoped>
button {
  width: 70px;
  height: 50px;
  background: #7f8080;
  color: #fff;
  font-size: 1.5em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  font-weight: 300;
  -webkit-appearance: none;
  border: 0;
  border-left: 1px solid #333;
  border-top: 1px solid #333;
}

button:focus {
  outline: 0;
}

.operator {
  background: #ff9d00;
}

.dark {
  background: #585656;
}

.wide {
  width: 140px;
}
</style>
