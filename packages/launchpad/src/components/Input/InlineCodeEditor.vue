<template>
  <div class="relative text-gray-600 overflow-hidden w-350px">
    <IconWrapper v-bind="{ ...iconWrapperProps, class: $attrs.class }">
      <template #default="slotProps">
        <CodeEditor
          :class="{
            [slotProps.iconOffsetClasses.prefix]: $slots.prefix || prefixIcon,
            [slotProps.iconOffsetClasses.suffix]: $slots.suffix || suffixIcon
          }"
          class="font-mono w-full h-full rounded border-transparent disabled:bg-cool-gray-100 disabled:text-cool-gray-400 border-cool-gray-300 focus:border-gray-500 focus:bg-white bg-gray-100 focus:ring-0 focus:outline-none focus:bg-white focus:text-gray-900 border-1 py-2 px-4 whitespace-pre overflow-auto"
          :readonly="readonly"
          v-model="localValue"
        />
      </template>
    </IconWrapper>
  </div>
</template>

<script lang="ts" setup>
import CodeEditor from '../CodeEditor.vue'
import { useModelWrapper } from '../../composables'
import IconWrapper, { iconProps } from '../IconWrapper.vue'
import { pick, keys } from 'lodash'

const props = defineProps({
  modelValue: {
    type: String,
  },
  readonly: {
    type: Boolean
  },
  ...iconProps
})

const emit = defineEmits(['update:modelValue'])
const iconWrapperProps = pick(props, keys(iconProps))
const localValue = useModelWrapper(props, emit, 'modelValue')
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
}
</style>