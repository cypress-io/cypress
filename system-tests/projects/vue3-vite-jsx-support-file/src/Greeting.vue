<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <p class="greeting">Hello, {{ name }}!</p>
</template>
