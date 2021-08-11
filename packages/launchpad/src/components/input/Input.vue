<template>
  <div class="p-0 m-0 border-0" :class="$attrs.class">
    <div class="relative rounded-md">
      <div v-if="hasPrefix" class="absolute inset-y-0 left-0 pl-4 flex items-center">
        <span class="text-gray-500 flex items-center justify-center">
          <slot name="prefix">
            <Icon
              v-if="prefixIcon"
              class="pointer-events-none"
              :icon="prefixIcon"
              :class="prefixIconClasses"
            ></Icon>
            <Icon v-else-if="type === 'search'" :icon="IconSearch" />
          </slot>
        </span>
      </div>
      <input
        :type="type"
        v-model="localValue"
        :class="_inputClasses"
        class="placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400 leading-tight focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2 border-gray-300 rounded-md"
        v-bind="inputAttrs"
      />
      <div v-if="hasSuffix" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <span class="text-gray-500 flex items-center justify-center">
          <slot name="suffix">
            <Icon :icon="suffixIcon" class="pointer-events-none" :class="suffixIconClasses"></Icon>
          </slot>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script lang="ts" setup>
import _ from 'lodash'
import IconSearch from 'virtual:vite-icons/mdi/magnify'
import type { InputHTMLAttributes, FunctionalComponent, SVGAttributes } from 'vue'
import { computed, useSlots, useAttrs } from 'vue'
import { useModelWrapper } from '../../composables'

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
  modelValue: ''
})

const emits = defineEmits(['update:modelValue'])

const localValue = useModelWrapper(props, emits, 'modelValue')

const hasPrefix = computed(() => {
  return slots.prefix || props.prefixIcon || props.type === 'search'
})

const hasSuffix = computed(() => {
  return slots.suffix || props.suffixIcon
})

const _inputClasses = computed(() => ([
  props.inputClasses,
  hasPrefix ? 'pl-10' : 'pl-4',
  hasSuffix ? 'pr-6' : 'pr-0'
]))

</script>
