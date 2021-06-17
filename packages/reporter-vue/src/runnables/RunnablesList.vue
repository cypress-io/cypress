<template>
  <div>Runnables List</div>
  <span>{{ runnables }}</span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    runnables: Object,
  },
});
</script>
