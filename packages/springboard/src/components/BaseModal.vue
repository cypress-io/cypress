<template>
  <div
    class="overlay"
    ref="overlay"
    @click.self="$emit('close')"
    @keypress.esc="$emit('close')"
  >
    <div class="wrapper">
      <CloseButton @click="$emit('close')"></CloseButton>
      <div class="content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import CloseButton from "./CloseButton.vue";

export default defineComponent({
  setup() {
    const overlay = ref<HTMLElement | null>(null);
    onMounted(() => {
      if (overlay && overlay.value) {
        overlay.value.focus();
      }
    });
    return {
      overlay,
    };
  },
  components: {
    CloseButton,
  },
  emits: ["close"],
});
</script>


<style lang="scss" scoped>
.overlay {
  @apply bg-gray-900 bg-opacity-40 absolute block top-0 left-0 w-[calc(100%)] h-[calc(100%)];
}

.wrapper {
  @apply w-128 bg-white min-h-64 p-8 h-auto my-[calc(10%)] mx-auto relative;
}
</style>