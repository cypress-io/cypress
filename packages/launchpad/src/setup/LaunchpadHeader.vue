<template>
  <h1
    class="pt-[14px] font-medium text-center text-[32px] leading-snug text-body-gray-900"
    :data-cy="`launchpad-${title}`"
  >
    {{ title }}
  </h1>
  <p
    class="text-center text-body-gray-600 text-lg"
  >
    {{ description }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
