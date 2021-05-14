<script>
import { defineComponent } from "vue";

export default defineComponent({});
</script>

<template>
  <div data-cy="display">
    <slot />
  </div>
</template>

<style scoped>
div {
  background: #333;
  text-align: right;
  padding: 15px 20px;
  color: #fff;
  font-size: 3em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Open Sans",
    "Helvetica Neue", sans-serif;
  font-weight: 200;
}
</style>
