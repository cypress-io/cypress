<template>
  <h1
    class="pt-20px font-medium text-center text-32px text-body-gray-900"
    :data-cy="`launchpad-${title}`"
  >
    {{ title }}
  </h1>
  <p
    class="mx-42px mt-12px text-center text-body-gray-600 text-18px"
    v-html="description"
  />
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
