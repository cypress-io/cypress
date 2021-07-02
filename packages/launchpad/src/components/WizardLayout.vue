<template>
  <div class="max-w-xl mx-auto border-1 border-gray-200 rounded m-10">
    <slot />
    <ButtonBar :next="next" :back="back" :alt="alt" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ButtonBar from "./ButtonBar.vue";

export default defineComponent({
  components: { ButtonBar },
  props: {
    next: {
      type: String,
      default: "Next Step",
    },
    back: {
      type: String,
      default: "Back",
    },
    alt: {
      type: String,
      default: undefined,
    },
  },
});
</script>
