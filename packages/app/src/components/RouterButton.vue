<template>
  <button
    v-if="props.disabled"
    :class="[
      VariantClassesTable[props.variant],
      SizeClassesTable[props.size],
      'opacity-70'
    ]"
    aria-disabled="true"
  >
    <slot />
  </button>
  <RouterLink
    v-else
    :to="to"
    :class="[
      VariantClassesTable[props.variant],
      SizeClassesTable[props.size]
    ]"
  >
    <slot />
  </RouterLink>
</template>

<script lang="ts" setup>
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { VariantClassesTable, SizeClassesTable, type ButtonVariants, type ButtonSizes } from '@cypress-design/constants-button'

const props = defineProps<{
  to: RouteLocationRaw
  variant: ButtonVariants
  size: ButtonSizes
  disabled?: boolean
}>()
</script>
