<template>
  <div
    class="relative text-gray-600 overflow-hidden w-350px"
    :class="[{ 'focus-within:text-gray-400': disabled }]"
  >
    <IconWrapper v-bind="{ ...iconWrapperProps, class: $attrs.class }">
      <template #prefix>
        <slot name="prefix"></slot>
      </template>
      <template #suffix>
        <slot name="suffix"></slot>
      </template>
      <template #default="slotProps">
        <input
          v-bind="{ ...omitAttrs($attrs), disabled }"
          autocomplete="off"
          autocorrect="off"
          :spellcheck="false"
          v-model="localValue"
          class="w-full h-full rounded border-transparent disabled:bg-cool-gray-100 disabled:text-cool-gray-400 border-cool-gray-300 focus:border-gray-500 focus:bg-white bg-gray-100 focus:ring-0 focus:outline-none focus:bg-white focus:text-gray-900 border-1 py-2 px-4 whitespace-pre overflow-auto"
          :type="type"
          :class="[inputClass, {
            [slotProps.iconOffsetClasses.prefix]: $slots.prefix || prefixIcon,
            [slotProps.iconOffsetClasses.suffix]: $slots.suffix || suffixIcon
          }]"
        />
      </template>
    </IconWrapper>
  </div>
</template>


<script lang="ts" setup>
import { computed } from 'vue'
import { useModelWrapper } from '../../composables'
import { omit, pick, keys } from 'lodash'
import type { IconType } from '../../types'
import IconWrapper, { iconProps } from '../IconWrapper.vue'

const props = withDefaults(defineProps<{
  prefixIcon?: IconType,
  prefixIconClass?: string,
  suffixIcon?: IconType,
  suffixIconClass?: string,
  type?: HTMLInputElement['type']
  modelValue?: string
  disabled?: boolean
  inputClass?: string | Array<any> | object
}>(), {
  modelValue: '',
  disabled: false,
  type: 'text'
})

const emit = defineEmits(['update:modelValue'])

const iconWrapperProps = computed(() => pick(props, keys(iconProps)))
const type = computed(() => props.type || 'text')
const localValue = useModelWrapper(props, emit, 'modelValue')
const omitAttrs = (attrs) => omit(attrs, 'class')
</script>

<style>
input {
  line-height: 1 !important;
}
</style>
