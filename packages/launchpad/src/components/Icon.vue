<template>
  <span class="flex align-center justify-center" v-if="icon">
    <component :is="icon" />
  </span>
</template>

<script lang="ts">
export default {
  inheritAttrs: true
}
</script>
<script lang="ts" setup>
import type { IconType } from '../types'

defineProps<{
  icon?: IconType | string
}>()
</script>
