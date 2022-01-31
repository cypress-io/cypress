<template>
  <button
    v-if="!props.href && !props.to"
    style="width: fit-content"
    class="flex items-center leading-tight border rounded outline-none gap-8px"
    :class="classes"
    :disabled="disabled"
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

  <!-- context for use of aria role and disabled here: https://www.scottohara.me/blog/2021/05/28/disabled-links.html -->
  <component
    :is="linkVersion"
    v-else
    :href="props.disabled ? null : props.href"
    :to="props.disabled ? null : props.to"
    :role="props.disabled ? 'link' : null"
    :aria-disabled="props.disabled ? 'disabled' : null "
    style="width: fit-content"
    class="flex items-center border rounded outline-none select-none gap-8px"
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
  </component>
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
import { RouterLink } from 'vue-router'

// eslint-disable-next-line no-duplicate-imports
import type { ButtonHTMLAttributes, FunctionalComponent, SVGAttributes } from 'vue'

const VariantClassesTable = {
  primary: 'border-indigo-500 bg-indigo-500 text-white hocus-default',
  outline: 'border-gray-100 text-indigo-600 hocus-default',
  tertiary: 'text-indigo-500 bg-indigo-50 border-transparent hocus-default',
  pending: 'bg-gray-500 text-white',
  link: 'border-transparent text-indigo-600 hocus-default',
  text: 'border-0',
  secondary: 'bg-jade-500 text-white hocus-secondary',
} as const

export type ButtonVariants = keyof(typeof VariantClassesTable)

const SizeClassesTable = {
  sm: 'px-6px py-2px text-14px h-24px',
  md: 'px-12px py-8px text-14px h-32px',
  lg: 'px-16px py-11px max-h-40px',
  'lg-wide': 'px-32px py-8px',
} as const

export type ButtonSizes = keyof(typeof SizeClassesTable)

const props = defineProps<{
  prefixIcon?: FunctionalComponent<SVGAttributes>
  suffixIcon?: FunctionalComponent<SVGAttributes>
  size?: ButtonSizes
  variant?: ButtonVariants
  prefixIconClass?: string
  suffixIconClass?: string
  href?: string // will cause the button to render as link element with button styles
  to?: object | string // will render as a router-link with button styles
  internalLink?: boolean
  disabled?: boolean
}>()

const attrs = useAttrs() as ButtonHTMLAttributes

const variantClasses = computed(() => (VariantClassesTable[props.variant || 'primary']))

const sizeClasses = computed(() => (SizeClassesTable[props.size || 'md']))

const classes = computed(() => {
  return [
    variantClasses.value,
    sizeClasses.value,
    attrs.class,
    (props.disabled && props.variant !== 'pending') ? 'opacity-50' : '',
    props.disabled ? 'cursor-default' : '',
  ]
})

const linkVersion = computed(() => {
  if (!props.to) {
    return props.internalLink ? BaseLink : ExternalLink
  }

  return RouterLink
})
</script>
