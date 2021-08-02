<template>
  <span class="flex align-center justify-center">
    <component :is="icon" :class="$attrs.class"></component>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { IconType } from '../types'

export default defineComponent({
  props: {
    icon: {
      type: Object as IconType,
      required: true
    }
  }
})
</script>
