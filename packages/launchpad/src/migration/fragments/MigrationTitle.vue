<template>
  <h3 class="font-medium mb-8px text-gray-900 leading-28px">
    {{ title }}<span class="text-gray-500"> — </span>here's why:
  </h3>
</template>

<script lang="ts" setup>

defineProps<{
  title: string
}>()
</script>
