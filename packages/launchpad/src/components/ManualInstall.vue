<template>
  <p>manually install these packages here</p>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { useStore } from "../../src/store";

export default defineComponent({
  setup(_, { emit }) {
    const store = useStore()
    onMounted(() => {
      store.onAlt(() => {
        emit("back")
      })
    })
    return;
  },
});
</script>
