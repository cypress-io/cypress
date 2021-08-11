<template>
  <div class="p-0 m-0 border-0 text-sm" :class="$attrs.class">
    <div class="relative rounded-md">
      <div v-if="hasPrefix" class="absolute inset-y-0 left-0 pl-4 flex items-center">
        <span class="text-gray-500 text-sm flex items-center justify-center">
          <slot name="prefix">
            <Icon
              v-if="prefixIcon"
              class="pointer-events-none"
              :icon="prefixIcon"
              :class="prefixIconClasses"
            ></Icon>
          </slot>
        </span>
      </div>
      <CodeEditor
        :class="_inputClasses"
        :readonly="readonly"
        class="font-mono w-full h-full rounded border-transparent disabled:bg-gray-100 disabled:text-gray-400 border-gray-300 focus:border-gray-500 focus:bg-white bg-gray-100 focus:ring-0 focus:outline-none focus:bg-white focus:text-gray-900 border-1 py-2 px-4 whitespace-pre overflow-auto"
        v-model="localValue"
      />
      <div v-if="hasSuffix" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <span class="text-gray-500 text-sm flex items-center justify-center">
          <slot name="suffix">
            <Icon :icon="suffixIcon" class="pointer-events-none" :class="suffixIconClasses"></Icon>
          </slot>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import "prismjs"
import "@packages/reporter/src/errors/prism.scss"
import CodeEditor from './CodeEditor.vue'
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { computed, useSlots } from 'vue'
import { useModelWrapper } from '../../composables'

const slots = useSlots()

const props = withDefaults(defineProps<{
  inputClasses?: string | string[] | Record<string, string>
  prefixIcon?: FunctionalComponent<SVGAttributes, {}>
  prefixIconClasses?: string | string[] | Record<string, string>
  suffixIcon?: FunctionalComponent<SVGAttributes, {}>
  suffixIconClasses?: string | string[] | Record<string, string>
  modelValue?: string
  readonly?: boolean
}>(), {
  modelValue: ''
})

const emits = defineEmits(['update:modelValue'])
const localValue = useModelWrapper(props, emits, 'modelValue')

const hasPrefix = computed(() => {
  return slots.prefix || props.prefixIcon
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

<style lang="scss">
.prism-editor__container {
  @apply whitespace-pre overflow-auto;
  scrollbar-width: 0;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  /* Track */
  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 5px grey;
    border-radius: 10px;
  }
}

.prism-editor__editor,
.prism-editor__textarea {
  @apply whitespace-pre;

  .token {
    background: none !important;
  }
}
</style>
