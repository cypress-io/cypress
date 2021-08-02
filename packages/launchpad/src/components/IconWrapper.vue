<template>
    <span class="absolute z-1 inset-y-0 left-0 flex items-center pl-2">
      <slot name="prefix" :iconClass="prefixIconClass" :containerClass="buttonClass">
        <button type="submit" :class="buttonClass" v-if="hasPrefix">
          <Icon :icon="prefixIcon" :class="prefixIconClass" />
        </button>
      </slot>
    </span>
    <span class="w-full h-full"
    :class="containerAttrs"
    ><slot
    :iconOffsetClasses="{
      'pr-36px': hasSuffix,
      'pl-32px': hasPrefix,
      }"
    ></slot></span>
    
    <span class="absolute z-1 inset-y-0 right-0 flex items-center pr-2">
      <slot name="suffix" :iconClass="suffixIconClass" :containerClass="buttonClass">
        <button type="submit" v-if="hasSuffix" :class="buttonClass">
          <Icon :icon="suffixIcon" :class="suffixIconClass" />
        </button>
      </slot>
    </span>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { useModelWrapper } from '../composables'
import Icon from './Icon.vue'
import {IconType } from '../types'

const buttonClass = "p-1 focus:outline-none focus:shadow-outline flex items-center"

export const iconProps = {
  prefixIcon: Object as PropType<IconType>,
  prefixIconClass: String,
  suffixIcon: Object as PropType<IconType>,
  suffixIconClass: String,
}

export default defineComponent({
  inheritAttrs: false,
  components: { Icon },
  props: {
    ...iconProps,
    modelValue: {
      type: String,
      default: ''
    },
  },
  setup(props, { emit, attrs, slots }) {
    const hasSuffix = computed(() => !!(props.suffixIcon || slots.suffix))
    const hasPrefix = computed(() => !!(props.prefixIcon || slots.prefix))

    return {
      hasSuffix,
      hasPrefix,
      localValue: useModelWrapper(props, emit, 'modelValue'),
      buttonClass,  
      containerAttrs: attrs.class || {}
    }
  }
})


</script>