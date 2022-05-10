<template>
  <h1 class="font-medium text-center pt-20px text-32px text-gray-900">
    {{ title }}
  </h1>
  <p
    class="mx-42px mt-12px text-center text-gray-600 text-18px"
    v-html="description"
  />
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
