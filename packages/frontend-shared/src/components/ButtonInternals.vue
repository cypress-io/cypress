<template>
  <span
    v-if="prefixIcon || $slots.prefix"
    class="flex justify-self-start items-center"
  >
    <slot name="prefix">
      <component
        :is="prefixIcon"
        :class="prefixIconClass"
      />
    </slot>
  </span>
  <span class="grow">
    <slot />
  </span>
  <span
    v-if="suffixIcon || $slots.suffix"
    class="flex justify-self-start items-center"
  >
    <slot name="suffix">
      <component
        :is="suffixIcon"
        :class="suffixIconClass"
      />
    </slot>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  inheritAttrs: true,
})
</script>

<script lang="ts" setup>

// eslint-disable-next-line no-duplicate-imports
import type { FunctionalComponent, SVGAttributes } from 'vue'

defineProps<{
  prefixIcon?: FunctionalComponent<SVGAttributes>
  suffixIcon?: FunctionalComponent<SVGAttributes>
  prefixIconClass?: string
  suffixIconClass?: string
}>()

</script>
