<template>
  <h1>{{ msg }}</h1>
  <button
    type="button"
    @click="count++"
  >
    count is: {{ count }}
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  msg: String
}>()

const count = ref(0)

defineExpose({
  count,
})
</script>
