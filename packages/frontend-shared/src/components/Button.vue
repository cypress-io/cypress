<template>
  <button
    style="width: fit-content"
    class="flex select-none items-center border rounded gap-8px outline-none"
    :class="classes"
  >
    <span
      v-if="prefixIcon || $slots.prefix"
      class="justify-self-start flex items-center"
    >
      <slot name="prefix">
        <component
          :is="prefixIcon"
          :class="prefixIconClass"
        />
      </slot>
    </span>
    <span class="flex-grow">
      <slot />
    </span>
    <span
      v-if="suffixIcon || $slots.suffix"
      class="justify-self-start flex items-center"
    >
      <slot name="suffix">
        <component
          :is="suffixIcon"
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

// eslint-disable-next-line no-duplicate-imports
import { computed, useAttrs } from 'vue'

// eslint-disable-next-line no-duplicate-imports
import type { ButtonHTMLAttributes, FunctionalComponent, SVGAttributes } from 'vue'

const VariantClassesTable = {
  primary: 'border-indigo-500 bg-indigo-500 text-white',
  outline: 'border-gray-100 text-indigo-600',
  pending: 'bg-gray-500 text-white',
  link: 'border-transparent text-indigo-600',
  text: 'border-0',
}

const SizeClassesTable = {
  sm: 'px-6px py-2px text-14px',
  md: 'px-12px py-6px text-14px',
  lg: 'px-16px py-11px max-h-40px',
  'lg-wide': 'px-32px py-8px',
}

const props = defineProps<{
  prefixIcon?: FunctionalComponent<SVGAttributes>
  suffixIcon?: FunctionalComponent<SVGAttributes>
  size?: 'sm' | 'md' | 'lg' | 'lg-wide'
  variant?: 'primary' | 'outline' | 'link' | 'text' | 'pending'
  prefixIconClass?: string
  suffixIconClass?: string
}>()

const attrs = useAttrs() as ButtonHTMLAttributes

const variantClasses = computed(() => (VariantClassesTable[props.variant || 'primary']))

const sizeClasses = computed(() => (SizeClassesTable[props.size || 'md']))

const classes = computed(() => {
  return [
    { 'hocus-default': props.variant !== 'pending' },
    variantClasses.value,
    sizeClasses.value,
    attrs.class,
    (attrs.disabled && props.variant !== 'pending') ? 'opacity-50' : '',
  ]
})
</script>
