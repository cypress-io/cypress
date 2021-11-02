<template>
  <span
    v-if="Object.keys(value).length"
  >
    {<br>
    <template
      v-for="(val, key) in value"
      :key="key"
    >
      <span
        class="ml-24px"
        :class="colorClasses"
      >'{{ key }}': '{{ val }}',</span><br>
    </template>
    }
  </span>
  <span
    v-else
  >{}</span>
</template>

<script lang="ts" setup>

defineProps<{
  value: Record<string, string>
  colorClasses?: string
}>()
</script>
