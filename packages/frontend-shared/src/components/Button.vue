<template>
  <button
    style="width: fit-content"
    class="flex items-center border rounded-sm gap-8px focus:border-indigo-600 focus:outline-transparent"
    :class="classes"
  >
    <span
      v-if="prefixIcon || $slots.prefix"
      :class="iconClasses"
      class="justify-self-start"
    >
      <slot name="prefix">
        <component :is="prefixIcon" :class="prefixIconClass"></component>
      </slot>
    </span>
    <span class="flex-grow">
      <slot />
    </span>
    <span
      v-if="suffixIcon || $slots.suffix"
      :class="iconClasses"
      class="justify-self-end"
    >
      <slot name="suffix">
        <component :is="suffixIcon" :class="suffixIconClass"></component>
      </slot>
    </span>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  inheritAttrs: true,
})
</script>

<script lang="ts" setup>

// eslint-disable-next-line no-duplicate-imports
import { computed, useAttrs } from 'vue'

// eslint-disable-next-line no-duplicate-imports
import type { ButtonHTMLAttributes, FunctionalComponent, SVGAttributes } from 'vue'

const VariantClassesTable = {
  primary: 'border-indigo-600 bg-indigo-600 text-white',
  outline: 'border-gray-200 text-indigo-600 bg-white',
  link: 'border-transparent text-indigo-600',
  text: 'border-0',
}

const SizeClassesTable = {
  sm: 'px-1 py-1 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-4 py-2 text-sm',
  xl: 'px-6 py-3 text-lg',
}

const IconClassesTable = {
  md: 'min-h-1.25em min-w-1.25em max-h-1.25em max-w-1.25em',
  lg: 'min-h-2em min-w-2em max-h-2em max-w-2em',
  xl: 'min-h-2.5em min-w-2.5em max-w-2.5em max-h-2.5em ',
}

const props = defineProps<{
  prefixIcon?: FunctionalComponent<SVGAttributes>
  suffixIcon?: FunctionalComponent<SVGAttributes>
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'outline' | 'link' | 'text'
  prefixIconClass?: string
  suffixIconClass?: string
}>()

const attrs = useAttrs() as ButtonHTMLAttributes

const variantClasses = VariantClassesTable[props.variant || 'primary']
const sizeClasses = SizeClassesTable[props.size || 'md']

const iconClasses = ['flex', 'items-center', IconClassesTable[props.size || 'md']]

const classes = computed(() => {
  return [
    variantClasses,
    sizeClasses,
    attrs.class,
    attrs.disabled ? 'opacity-50' : '',
  ]
})
</script>
