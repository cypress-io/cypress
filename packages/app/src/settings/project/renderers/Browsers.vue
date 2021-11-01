<template>
  <span>[<span
    v-for="browser in browsers"
    :key="browser.name"
  >'{{ browser.name }}', </span>]</span>
</template>

<script lang="ts" setup>

defineProps<{
  browsers: any[]
}>()
</script>
