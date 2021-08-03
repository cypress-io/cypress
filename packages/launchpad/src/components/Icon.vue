<template>
  <span class="flex align-center justify-center" v-if="icon">
    <component :is="icon" :class="$attrs.class" />
  </span>
</template>

<script lang="ts" setup>
import type { IconType } from '../types'

defineProps<{
  icon?: IconType | string
}>()
</script>
