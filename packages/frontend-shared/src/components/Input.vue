<template>
  <div
    class="border-0 m-0 p-0"
    :class="$attrs.class"
  >
    <div class="relative">
      <div
        v-if="hasPrefix"
        class="flex pl-4 inset-y-0 left-0 absolute items-center"
      >
        <span class="flex text-gray-500 items-center justify-center">
          <slot name="prefix">
            <component
              :is="prefixIcon"
              v-if="prefixIcon"
              class="pointer-events-none"
              :class="prefixIconClasses"
            />
            <i-cy-magnifying-glass_x16
              v-else-if="type === 'search'"
              class="icon-light-gray-50 icon-dark-gray-500"
            />
          </slot>
        </span>
      </div>
      <input
        v-model="localValue"
        :style="style"
        :type="type"
        :spellcheck="false"
        :class="[_inputClasses, {'hocus-default text-gray-800': !hasError, 'hocus-error text-error-500': hasError}]"
        class="rounded-md border-gray-100 leading-tight w-full py-9px pl-10 placeholder-gray-400 text-gray-800 block disabled:bg-gray-100 disabled:text-gray-400"
        v-bind="inputAttrs"
      >
      <div
        v-if="hasSuffix"
        class="flex pr-3 inset-y-0 right-0 absolute items-center"
      >
        <span class="flex text-gray-500 items-center justify-center">
          <slot name="suffix">
            <component
              :is="suffixIcon"
              v-if="suffixIcon"
              class="pointer-events-none"
              :class="suffixIconClasses"
            />
          </slot>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script lang="ts" setup>
import _ from 'lodash'

import type { InputHTMLAttributes, FunctionalComponent, SVGAttributes } from 'vue'
// eslint-disable-next-line no-duplicate-imports
import { computed, useSlots, useAttrs } from 'vue'
import { useModelWrapper } from '../composables'

const slots = useSlots()
const attrs = useAttrs()

const inputAttrs = _.omit(attrs, 'class')

const props = withDefaults(defineProps<{
  type?: InputHTMLAttributes['type']
  inputClasses?: string | string[] | Record<string, string>
  prefixIcon?: FunctionalComponent<SVGAttributes, {}>
  prefixIconClasses?: string | string[] | Record<string, string>
  suffixIcon?: FunctionalComponent<SVGAttributes, {}>
  suffixIconClasses?: string | string[] | Record<string, string>
  modelValue?: string
  style?: string
  hasError?: boolean
}>(), {
  type: 'text',
  modelValue: '',
  inputClasses: undefined,
  prefixIcon: undefined,
  prefixIconClasses: undefined,
  suffixIcon: undefined,
  suffixIconClasses: undefined,
  style: '',
  hasError: false,
})

const emits = defineEmits(['update:modelValue'])

const localValue = useModelWrapper(props, emits, 'modelValue')

const hasPrefix = computed(() => {
  return !!(slots.prefix || props.prefixIcon || props.type === 'search')
})

const hasSuffix = computed(() => {
  return !!(slots.suffix || props.suffixIcon)
})

const _inputClasses = computed(() => {
  return ([
    props.inputClasses,
    hasPrefix.value ? 'pl-10' : 'pl-4',
    hasSuffix.value ? 'pr-6' : 'pr-0',
  ])
})

</script>

<style scoped>
::-webkit-search-cancel-button{
    display: none;
}

</style>
