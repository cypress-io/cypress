<template>
  <span v-if="value.length">[<br>
    <template
      v-for="blockHost in value"
      :key="blockHost"
    >
      <span class="line">'{{ blockHost }}',</span><br> </template>
    ]
  </span>
  <span v-else>{}</span>
</template>

<script lang="ts" setup>

defineProps<{
  value: any[]
}>()
</script>
