<template>
  <!-- eslint-disable vue/multiline-html-element-content-newline  -->
  <a
    :href="props.href"
    :class="classes"
  ><slot /></a>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  inheritAttrs: true,
})
</script>

<script setup lang="ts">
/* eslint-disable no-duplicate-imports */

import { computed, useAttrs } from 'vue'

import type { AnchorHTMLAttributes } from 'vue'

const attrs = useAttrs() as AnchorHTMLAttributes

// if no class is used, the link receives a default color
const classes = computed(() => {
  const hocus = props.useDefaultHocus ? 'hocus-link-default' : ''

  return `${attrs.class ?? 'text-indigo-500'} ${hocus}`
})

const props = withDefaults(defineProps<{
  href: string,
  useDefaultHocus?: boolean
}>(), {
  useDefaultHocus: true,
})

</script>
