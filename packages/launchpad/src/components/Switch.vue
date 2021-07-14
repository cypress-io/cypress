<template>
  <button
    class="rounded-md h-3 w-6 relative focus:outline-transparent"
    :class="value ? 'bg-green-600' : 'bg-gray-600'"
    @click="$emit('update', !value)"
  >
    <span
      class="
        absolute
        block
        toggle
        border border-1 border-gray-300
        rounded-md
        bg-white
      "
      :class="value ? 'toggle-on' : ''"
    />
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: {
    update: Boolean,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style scoped>
.toggle {
  left: 1px;
  top: 1px;
  height: 10px;
  width: 10px;
  transition: left 0.2s;
}

.toggle-on {
  left: 13px;
}
</style>
