<template>
  <span class="closeButton" role="button">❌</span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  setup() {},
});
</script>

<style lang="scss" scoped>
.closeButton {
  @apply cursor-pointer absolute top-4 right-4 hover:opacity-50;
}
</style>