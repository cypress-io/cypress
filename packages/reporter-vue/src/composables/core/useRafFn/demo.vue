<script setup lang="ts">
import { ref } from 'vue'
import { useRafFn } from '.'

const count = ref(0)
const { pause, resume } = useRafFn(() => count.value += 1)
</script>

<template>
  <div>Count: {{ count }}</div>
</template>
