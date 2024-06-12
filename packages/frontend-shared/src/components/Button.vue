<template>
  <button
    v-if="!props.href && !props.to"
    style="width: fit-content"
    class="border rounded flex outline-none leading-tight gap-[8px] items-center"
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

  <!-- @vue-expect-error -->
  <component
    :is="linkVersion"
    v-else
    v-bind="linkProps"
    style="width: fit-content"
    class="border rounded flex outline-none gap-[8px] items-center select-none"
    :class="classes"
    :use-default-hocus="false"
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
  </component>
</template>

<script lang="ts">
import ButtonInternals from './ButtonInternals.vue'
import ExternalLink from '../gql-components/ExternalLink.vue'
import BaseLink from '../components/BaseLink.vue'

const VariantClassesTable = {
  primary: 'border-indigo-500 bg-indigo-500 focus:bg-indigo-600 text-white hocus-default',
  outline: 'border-gray-100 text-indigo-600 hocus-default',
  tertiary: 'text-indigo-500 bg-indigo-50 border-transparent hocus-default',
  pending: 'bg-gray-500 text-white',
  link: 'border-transparent text-indigo-600 hocus-default',
  linkBold: 'border-transparent text-indigo-500 font-medium',
  text: 'border-0',
  secondary: 'bg-jade-500 text-white hocus-secondary',
  white: 'bg-white text-indigo-500 font-medium hocus-default',
} as const

const SizeClassesTable = {
  sm: 'px-[6px] py-[2px] text-[14px] h-[24px]',
  md: 'px-[12px] py-[8px] text-[14px] h-[32px]',
  lg: 'px-[16px] py-[11px] max-h-[40px]',
  'lg-wide': 'px-[32px] py-[8px]',
} as const

export type ButtonVariants = keyof(typeof VariantClassesTable)

export type ButtonSizes = keyof(typeof SizeClassesTable)

export const inheritAttrs = true

</script>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue'
import { RouterLink } from 'vue-router'
import type { ButtonHTMLAttributes, FunctionalComponent, SVGAttributes } from 'vue'

const props = defineProps<{
  prefixIcon?: FunctionalComponent<SVGAttributes>
  suffixIcon?: FunctionalComponent<SVGAttributes>
  size?: ButtonSizes
  variant?: ButtonVariants
  prefixIconClass?: string | Record<string, string | boolean>
  suffixIconClass?: string
  href?: string // will cause the button to render as link element with button styles
  to?: object | string // will render as a router-link with button styles
  internalLink?: boolean
  disabled?: boolean
}>()

const attrs = useAttrs() as ButtonHTMLAttributes

// Disabled buttons should not have hover/focus styles so filter out classes including "hocus"
function filterHocus (classes: string): string {
  return classes.split(' ').filter((css) => !(css.startsWith('hocus') && props.disabled)).join(' ')
}

const variantClasses = computed(() => {
  const variantClasses = VariantClassesTable[props.variant || 'primary']

  return props.disabled ? filterHocus(variantClasses) : variantClasses
})

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

  if (props.disabled) {
    return BaseLink
  }

  return RouterLink
})

const linkProps = computed(() => {
  // context for use of aria role and disabled here: https://www.scottohara.me/blog/2021/05/28/disabled-links.html

  if (props.disabled) {
    return {
      role: 'link',
      ariaDisabled: 'true',
      href: null,
    }
  }

  if (props.to) return { to: props.to }

  if (props.href) return { href: props.href }

  return {}
})
</script>
