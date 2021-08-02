<template>
  <div :class="[wrapperStyles, 'w-350px']">
    <IconWrapper v-bind="{ ...iconWrapperProps, class: $attrs.class }">
      <template #default="slotProps">
        <CodeEditor
          :class="[inputStyles, wrapperStyles, slotProps.iconOffsetClasses]"
          class="font-mono"
          :readonly="readonly"
          v-model="localValue"
        />
      </template>
    </IconWrapper>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CodeEditor from '../CodeEditor.vue'
import { useModelWrapper } from '../../composables'
import { wrapperStyles, inputStyles } from './input-styles'
import IconWrapper, { iconProps } from '../IconWrapper.vue'
import { pick, keys } from 'lodash'

export default defineComponent({
  components: { CodeEditor, IconWrapper },
  props: {
    modelValue: {
      type: String,
    },
    readonly: {
      type: Boolean
    },
    ...iconProps
  },
  setup(props, { emit }) {
    const iconWrapperProps = pick(props, keys(iconProps))
    return {
      iconWrapperProps,
      wrapperStyles,
      inputStyles,
      localValue: useModelWrapper(props, emit, 'modelValue')
    }
  }
})
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