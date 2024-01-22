<script lang="ts" setup>
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { VariantClassesTable, SizeClassesTable, type ButtonVariants, type ButtonSizes } from '@cypress-design/constants-button'

const props = defineProps<{
  to: RouteLocationRaw
  variant: ButtonVariants
  size: ButtonSizes
}>()
</script>

<template>
  <RouterLink
    :to="to"
    :class="[
      VariantClassesTable[props.variant],
      SizeClassesTable[props.size]
    ]"
  >
    <slot />
  </RouterLink>
</template>
