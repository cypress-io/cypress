<template>
  <div
    class="p-0 m-0 border-0"
    :class="$attrs.class"
  >
    <div class="relative">
      <div
        v-if="hasPrefix"
        class="absolute inset-y-0 left-0 flex items-center pl-4"
      >
        <span class="flex items-center justify-center text-gray-500">
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
        :type="type"
        :spellcheck="false"
        :class="_inputClasses"
        class="block w-full pl-10 text-gray-800 leading-tight placeholder-gray-400
      hocus-default border-gray-100 rounded-md disabled:bg-gray-100 disabled:text-gray-400
      py-9px"
        v-bind="inputAttrs"
      >
      <div
        v-if="hasSuffix"
        class="absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <span class="flex items-center justify-center text-gray-500">
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
}>(), {
  type: 'text',
  modelValue: '',
  inputClasses: undefined,
  prefixIcon: undefined,
  prefixIconClasses: undefined,
  suffixIcon: undefined,
  suffixIconClasses: undefined,
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
