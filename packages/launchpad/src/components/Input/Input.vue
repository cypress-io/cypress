<template>
  <div
    :class="[wrapperStyles, { 'focus-within:text-gray-400': disabled }]">
    <IconWrapper v-bind="{ ...iconWrapperProps, class: $attrs.class }">
      <template #default="slotProps">
        <input
          v-bind="inputAttrs"
          autocomplete="off"
          autocorrect="off"
          :spellcheck="false"
          v-model="localValue"
          :type="type"
          :class="[inputStyles, inputClass, slotProps.iconOffsetClasses]"
          />
        </template>
    </IconWrapper>
  </div>
</template>


<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { useModelWrapper } from '../../composables'
import { omit, pick, keys } from 'lodash'
import IconWrapper, { iconProps } from '../IconWrapper.vue'
import { inputStyles, wrapperStyles } from './input-styles'

export default defineComponent({
  components: { IconWrapper },
  inheritAttrs: false,
  props: {
    ...iconProps,
    type: {
      type: String as PropType<HTMLInputElement['type']>
    },
    modelValue: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    inputClass: {
      type: [String, Array, Object],
    }
  },
  setup(props, { emit, attrs }) {
    const iconWrapperProps = pick(props, keys(iconProps))

    return {
      wrapperStyles,
      inputStyles,
      iconWrapperProps: computed(() => iconWrapperProps),
      type: computed(() => props.type || 'text'),
      localValue: useModelWrapper(props, emit, 'modelValue'),
      inputAttrs: { ...omit(attrs, 'class'), disabled: props.disabled },
    }
  }
})
</script>

<style>
input {
  line-height: 1 !important;
}
</style>
