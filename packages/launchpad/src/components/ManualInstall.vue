<template>
  <p>manually install these packages here</p>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { useStore } from "../../src/store";

export default defineComponent({
  setup(_) {
    const store = useStore()
    return;
  },
});
</script>
