<template>
  <button
    v-if="!href"
    style="width: fit-content"
    class="flex select-none items-center border rounded gap-8px outline-none"
    :class="classes"
  >
    <ButtonInternals>
      <template
        v-if="prefixIcon || $slots.prefix"
        #prefix
      >
        <slot name="prefix">
          <component
            :is="prefixIcon"
            :class="prefixIconClass"
          />
        </slot>
      </template>
      <template #default>
        <slot />
      </template>
      <template
        v-if="suffixIcon || $slots.suffix"
        #suffix
      >
        <slot name="suffix">
          <component
            :is="suffixIcon"
            :class="suffixIconClass"
          />
        </slot>
      </template>
    </ButtonInternals>
  </button>
  <Component
    :is="internalLink ? BaseLink : ExternalLink"
    v-else
    :href="href"
    style="width: fit-content"
    class="flex select-none items-center border rounded gap-8px outline-none"
    :class="classes"
  >
    <ButtonInternals>
      <template
        v-if="prefixIcon || $slots.prefix"
        #prefix
      >
        <slot name="prefix">
          <component
            :is="prefixIcon"
            :class="prefixIconClass"
          />
        </slot>
      </template>
      <template #default>
        <slot />
      </template>
      <template #suffix>
        <slot
          v-if="suffixIcon || $slots.suffix"
          name="suffix"
        >
          <component
            :is="suffixIcon"
            :class="suffixIconClass"
          />
        </slot>
      </template>
    </ButtonInternals>
  </Component>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ButtonInternals from './ButtonInternals.vue'
import ExternalLink from '../gql-components/ExternalLink.vue'
import BaseLink from '../components/BaseLink.vue'

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
  tertiary: 'text-indigo-500 bg-indigo-50 border-transparent',
  pending: 'bg-gray-500 text-white',
  link: 'border-transparent text-indigo-600',
  text: 'border-0',
} as const

export type ButtonVariants = keyof(typeof VariantClassesTable)

const SizeClassesTable = {
  sm: 'px-6px py-2px text-14px h-24px',
  md: 'px-12px py-8px text-14px h-32px',
  lg: 'px-16px py-11px max-h-40px',
  'lg-wide': 'px-32px py-8px',
} as const

const props = defineProps<{
  prefixIcon?: FunctionalComponent<SVGAttributes>
  suffixIcon?: FunctionalComponent<SVGAttributes>
  size?: keyof typeof SizeClassesTable
  variant?: ButtonVariants
  prefixIconClass?: string
  suffixIconClass?: string
  href?: string // will cause the button to render as link element with button styles
  internalLink?: boolean
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
