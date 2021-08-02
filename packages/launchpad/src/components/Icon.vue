<template>
  <span class="flex align-center justify-center" v-if="icon">
    <component :is="icon" :class="$attrs.class" />
  </span>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'
// TODO: the validator for icon fails when I use IconType as the expected type.
// Not sure why.
// @ts-ignore
import type { IconType } from '../types'

defineProps<{
  icon?: any
}>()
</script>
