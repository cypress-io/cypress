<template>
  <span class="absolute z-1 inset-y-0 left-0 flex items-center pl-2">
    <slot
      name="prefix"
      :iconClass="props.prefixIconClass"
      :containerClass="buttonClass"
    >
      <button
        type="submit"
        :class="buttonClass"
      >
        <Icon
          :icon="props.prefixIcon"
          :class="props.prefixIconClass"
        />
      </button>
    </slot>
  </span>
  <span
    class="w-full h-full"
    :class="containerAttrs"
  ><slot
    :iconOffsetClasses="{
      suffix: 'pr-36px',
      prefix: 'pl-32px',
    }"
  /></span>

  <span class="absolute z-1 inset-y-0 right-0 flex items-center pr-2">
    <slot
      name="suffix"
      :iconClass="props.suffixIconClass"
      :containerClass="buttonClass"
    >
      <button
        type="submit"
        :class="buttonClass"
      >
        <Icon
          :icon="props.suffixIcon"
          :class="props.suffixIconClass"
        />
      </button>
    </slot>
  </span>
</template>

<script lang="ts" setup>
import { FunctionalComponent, SVGAttributes, useAttrs } from 'vue'
import Icon from './Icon.vue'

type IconType = FunctionalComponent<SVGAttributes>

const buttonClass = 'p-1 focus:outline-none focus:shadow-outline flex items-center'

const props = defineProps<{
  prefixIcon: IconType
  prefixIconClass: string
  suffixIcon: IconType
  suffixIconClass: string
  modelValue?: string
}>()

const containerAttrs = useAttrs().class
</script>
