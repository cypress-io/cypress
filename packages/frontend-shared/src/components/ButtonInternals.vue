<template>
  <span
    v-if="$slots.prefix"
    class="flex justify-self-start items-center"
  >
    <slot name="prefix" />
  </span>
  <span class="grow">
    <slot />
  </span>
  <span
    v-if="$slots.suffix"
    class="flex justify-self-start items-center"
  >
    <slot name="suffix" />
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  inheritAttrs: true,
})
</script>
