<template>
  <div>RunnableList</div>
  <!-- {{ runnables }} -->
  <div>{{ runnables }}</div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { flatten } from "./utils";

export default defineComponent({
  props: ["runnables"],
  setup({ runnables }) {
    return {
      runnables: computed(() => flatten(runnables)),
    };
  },
});
</script>
