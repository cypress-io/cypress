<template>
  <button
    style="width: fit-content"
    class="flex items-center border rounded-sm gap-8px focus:border-indigo-600 focus:outline-transparent"
    :class="classes"
  >
    <span v-if="prefixIcon || $slots.prefix" :class="iconClasses" class="justify-self-start">
      <slot name="prefix">
        <Icon :icon="prefixIcon" :class="prefixIconClass" />
      </slot>
    </span>
    <span class="flex-grow">
      <slot />
    </span>
    <span v-if="suffixIcon || $slots.suffix" :class="iconClasses" class="justify-self-end">
      <slot name="suffix">
        <Icon :icon="suffixIcon" :class="suffixIconClass" />
      </slot>
    </span>
  </button>
</template>

<script lang="ts">
export default defineComponent({
  inheritAttrs: true,
})
</script>

<script lang="ts" setup>
import { defineProps, computed, defineComponent, useAttrs } from "vue"
import type { ButtonHTMLAttributes, FunctionalComponent, SVGAttributes } from "vue"

const VariantClassesTable = {
  primary: "border-indigo-600 bg-indigo-600 text-white",
  outline: "border-gray-200 text-indigo-600 bg-white",
  link: "border-transparent text-indigo-600",
}

const SizeClassesTable = {
  sm: "px-1 py-1 text-xs",
  md: 'px-2 py-1 text-xs',
  lg: "px-4 py-2 text-sm",
  xl: "px-6 py-3 text-lg"
}

const IconClassesTable = {
  md: "h-1.25em w-1.25em",
  lg: "h-2em w-2m",
  xl: "h-2.5em w-2.5em"
}

const props = defineProps<{
  prefixIcon?: FunctionalComponent<SVGAttributes>
  suffixIcon?: FunctionalComponent<SVGAttributes>
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: "primary" | "outline" | "link" | "underline"
  prefixIconClass?: string
  suffixIconClass?: string
}>()

const attrs = useAttrs() as ButtonHTMLAttributes

const variantClasses = VariantClassesTable[props.variant || 'primary']
const sizeClasses = SizeClassesTable[props.size || 'md']

const iconClasses = ['flex', 'items-center', IconClassesTable[props.size || 'md']]

const classes = computed(() => [
  variantClasses,
  sizeClasses,
  attrs.class,
  attrs.disabled ? 'opacity-50' : ''
])
</script>
