<template>
  <span :class="colorClasses">{{ browsers }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  browsers: any[]
  colorClasses?: string
}>()

const browsers = computed(() => props.browsers.length ? props.browsers.map((b) => b.name).join(', ') : '<None>')
</script>
