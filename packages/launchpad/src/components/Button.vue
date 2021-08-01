<template>
  <button
    style="width: fit-content"
    class="
    flex
    items-center
    border
    rounded-sm
    gap-8px
    focus:border-indigo-600 focus:outline-transparent
    "
    :class="classes"
    @click="$emit('click')"
  >
    <span v-if="prefixIcon || $slots.prefix"  :class="iconClasses" class="justify-self-start">
      <slot name="prefix">
        <Icon :icon="prefixIcon" :class="prefixIconClass" />
      </slot>
    </span>
    <span class="flex-grow"><slot /></span>
    <span v-if="suffixIcon || $slots.suffix" :class="iconClasses" class="justify-self-end">
      <slot name="suffix">
        <Icon :icon="suffixIcon" :class="suffixIconClass" />
      </slot>
    </span>
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import type { IconType } from '../types'

const VariantClassesTable = {
  primary: "border-indigo-600 bg-indigo-600 text-white",
  outline: "border-gray-200 text-indigo-600",
  link: "border-transparent text-indigo-600",
};

const SizeClassesTable = {
  sm: "px-1 py-1 text-xs",
  md: 'px-2 py-1 text-xs',
  lg: "px-4 py-2 text-sm",
  xl: "px-6 py-3 text-lg"
}

const IconClassesTable = {
  md: "h-1.25em w-1.25em",
  lg: "h-2em w-2m",
  xl: "h-2.5em w-2.5em"
}

export default defineComponent({
  emits: { click: null },
  props: {
    prefixIcon: {
      type: Object as IconType,
    },
    suffixIcon: {
      type: Object as IconType,
    },
    size: {
      type: String as PropType<"xs" | "sm" | "md" | "lg" | "xl">,
      default: 'md'
    },
    variant: {
      type: String as PropType<"primary" | "outline" | "link">,
      default: "primary",
    },
    class: {
      type: String,
      default: "",
    },
    prefixIconClass: {
      type: String,
    },
    suffixIconClass: {
      type: String,
    }
  },
  setup(props) {
    const variantClasses = VariantClassesTable[props.variant];
    const sizeClasses = SizeClassesTable[props.size];

    return {
      iconClasses: ['flex', 'items-center', IconClassesTable[props.size]],
      classes: [
        variantClasses,
        sizeClasses,
        props.class
      ]
    }
  },
});
</script>
