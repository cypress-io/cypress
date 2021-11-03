<template>
  <span
    v-if="value.length"
    :class="colorClasses"
  >[<br>
    <template
      v-for="blockHost in value"
      :key="blockHost"
    >
      <span
        :class="colorClasses"
      >'{{ blockHost }}',</span><br> </template>
    ]
  </span>
  <span
    v-else
    :class="colorClasses"
  >{}</span>
</template>

<script lang="ts" setup>

defineProps<{
  value: string[],
  colorClasses?: string
}>()
</script>
