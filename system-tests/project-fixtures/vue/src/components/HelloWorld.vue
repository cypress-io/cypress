<script setup>
import { ref } from "vue";

defineProps({
  msg: String,
});

const count = ref(0);

function handleClick () {
  count.value++;
  fetch("http://localhost:3000/hello", {
    method: "GET",
  });
}
</script>

<template>
  <div>
    <h1>{{ msg }}</h1>
    <button
      id="button"
      type="button"
      @click="handleClick"
    >
      count is {{ count }}
    </button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
