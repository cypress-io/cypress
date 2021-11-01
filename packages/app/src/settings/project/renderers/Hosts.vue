<template>
  <code>[<span
    v-for="(host, key) in hosts"
    :key="key"
  >
    '{{ key }}': '{{ host }}',
  </span>]</code>
</template>

<script lang="ts" setup>

defineProps<{
  hosts: any
}>()
</script>
