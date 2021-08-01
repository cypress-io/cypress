<template>
  <div
    class="relative text-gray-600 overflow-hidden w-350px"
    :class="[containerAttrs, {
      'focus-within:text-gray-400': disabled,
    }]">
    <span class="absolute inset-y-0 left-0 flex items-center pl-2">
      <slot name="prefix" :iconClass="prefixIconClass" :containerClass="buttonClass">
        <button type="submit" :class="buttonClass" v-if="prefixIcon || $slots.prefix">
          <Icon :icon="prefixIcon" :class="prefixIconClass" />
        </button>
      </slot>
    </span>
    <span class="w-full h-full px-2 py-2 indent-4px"
    :class="{
          'pr-36px': hasSuffix,
          'pl-32px': hasPrefix,
        }"
    ><slot></slot></span>
    
    <span class="absolute inset-y-0 right-0 flex items-center pr-2">
      <slot name="suffix" :iconClass="suffixIconClass" :containerClass="buttonClass">
        <button type="submit" v-if="suffixIcon || $slots.suffix" :class="buttonClass">
          <Icon :icon="suffixIcon" :class="suffixIconClass" />
        </button>
      </slot>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { useModelWrapper } from '../composables'
import { omit } from 'lodash'

const buttonClass = "p-1 focus:outline-none focus:shadow-outline flex items-center"

export default defineComponent({
  inheritAttrs: false,
  props: {
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
    prefixIcon: {
      type: String
    },
    prefixIconClass: {
      type: String
    },
    suffixIcon: {
      type: String
    },
    suffixIconClass: {
      type: String
    },
    inputClass: {
      type: [String, Array, Object],
    }
  },
  setup(props, { emit, attrs, slots }) {
    const hasSuffix = computed(() => props.suffixIcon || slots.suffix)
    const hasPrefix = computed(() => props.prefixIcon || slots.prefix)
    return {
      type: computed(() => props.type || 'text'),
      hasSuffix,
      hasPrefix,
      localValue: useModelWrapper(props, emit, 'modelValue'),
      buttonClass,
      inputAttrs: { ...omit(attrs, 'class'), disabled: props.disabled },
      containerAttrs: attrs.class || {}
    }
  }
})
</script>

<style>
input {
  line-height: 1 !important;
}
</style>
