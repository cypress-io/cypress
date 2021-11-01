<template>
  <span>[<span
    v-for="blockHost in blockHosts"
    :key="blockHost"
  >'{{ blockHost }}', </span>]</span>
</template>

<script lang="ts" setup>

defineProps<{
  blockHosts: any[]
}>()
</script>
