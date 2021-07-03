<template>
  <button
    class="bg-gray-50 px-3 py-1 rounded absolute top-2 right-2 text-indigo-600"
    @click="copyToClipboard"
  >
    Copy
  </button>
  <textarea class="absolute -top-96" ref="textElement">{{ text }}</textarea>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup() {
    const textElement = ref<HTMLTextAreaElement | null>(null);
    const copyToClipboard = () => {
      textElement.value?.select();
      document.execCommand("copy");
    };
    return { copyToClipboard, textElement };
  },
});
</script>
