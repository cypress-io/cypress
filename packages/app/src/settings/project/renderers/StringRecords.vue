<template>
  <span v-if="Object.keys(value).length">{<br>
    <template
      v-for="(val, key) in value"
      :key="key"
    >
      <span class="line ml-24px">'{{ key }}': '{{ val }}',</span><br>
    </template>
    <span class="line">}</span>
  </span>
  <span v-else>{}</span>
</template>

<script lang="ts" setup>

defineProps<{
  value: Record<string, string>
}>()
</script>
