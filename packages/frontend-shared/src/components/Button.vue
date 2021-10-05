<template>
  <button
    style="width: fit-content"
    class="flex items-center border rounded gap-8px hocus-default"
    :class="classes"
  >
    <span
      v-if="prefixIcon || $slots.prefix"
      :class="iconClasses"
      class="justify-self-start"
    >
      <slot name="prefix">
        <Icon
          :icon="prefixIcon"
          :class="prefixIconClass"
        />
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
        <Icon
          :icon="suffixIcon"
          :class="suffixIconClass"
        />
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
import Icon from './Icon.vue'

// eslint-disable-next-line no-duplicate-imports
import { computed, useAttrs } from 'vue'

// eslint-disable-next-line no-duplicate-imports
import type { ButtonHTMLAttributes, FunctionalComponent, SVGAttributes } from 'vue'

const VariantClassesTable = {
  primary: 'border-indigo-500 bg-indigo-600 text-white',
  outline: 'border-gray-100 text-indigo-600',
  link: 'border-transparent text-indigo-600',
  text: 'border-0',
}

const SizeClassesTable = {
  sm: 'px-6px py-2px text-14px',
  md: 'px-12px py-6px text-14px',
  lg: 'px-16px py-8px',
}

const IconClassesTable = {
  sm: 'min-h-1.25em min-w-1.25em max-h-1.25em max-w-1.25em',
  md: 'min-h-2em min-w-2em max-h-2em max-w-2em',
  lg: 'min-h-2.5em min-w-2.5em max-w-2.5em max-h-2.5em ',
}

const props = defineProps<{
  prefixIcon?: FunctionalComponent<SVGAttributes>
  suffixIcon?: FunctionalComponent<SVGAttributes>
  size?: 'sm' | 'md' | 'lg'
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
