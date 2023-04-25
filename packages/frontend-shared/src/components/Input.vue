<template>
  <div
    class="p-0 m-0 border-0"
    :class="$attrs.class"
  >
    <div
      class="relative flex flex-row leading-tight border border-gray-100 rounded-md"
      :class="[props.inputClasses, {'hocus-default focus-within-default': !hasError, 'border-error-300 ring-2 ring-error-100 hocus-error': hasError}]"
    >
      <div
        v-if="hasPrefix"
        class="flex flex-none ml-[-1px] pl-4 items-center"
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
        :ref="props.inputRef?.()"
        v-model="localValue"
        :style="style"
        :type="type"
        :spellcheck="false"
        :class="[{'text-gray-800': !hasError, 'text-error-500': hasError}]"
        autocomplete="off"
        class="border-0 flex-1 ml-[1px] min-w-[100px] py-[9px] pl-2 placeholder-gray-400 text-gray-800 block disabled:bg-gray-100 disabled:text-gray-400"
        v-bind="inputAttrs"
      >
      <div
        v-if="hasSuffix"
        class="flex flex-none mr-[-1px] pr-3 items-center"
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

import type { InputHTMLAttributes, FunctionalComponent, SVGAttributes, Ref } from 'vue'
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
  inputRef?: () => Ref<HTMLInputElement | undefined>
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
  inputRef: undefined,
})

const emits = defineEmits(['update:modelValue'])

const localValue = useModelWrapper(props, emits, 'modelValue')

const hasPrefix = computed(() => {
  return !!(slots.prefix || props.prefixIcon || props.type === 'search')
})

const hasSuffix = computed(() => {
  return !!(slots.suffix || props.suffixIcon)
})

</script>

<style scoped>
::-webkit-search-cancel-button{
    display: none;
}

</style>
