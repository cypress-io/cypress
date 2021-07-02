<template>
  <button
    class="
      border
      px-4
      py-2
      rounded
      text-sm
      focus:border-indigo-600 focus:outline-transparent
    "
    :class="variantClasses + ' ' + additionalClasses"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

const VariantClassesTable = {
  primary: "border-indigo-600 bg-indigo-600 text-white",
  outline: "border-gray-200 text-indigo-600",
  link: "border-transparent text-indigo-600",
};

export default defineComponent({
  emits: { click: null },
  props: {
    variant: {
      type: String as PropType<"primary" | "outline" | "link">,
      default: "primary",
    },
    class: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const variantClasses = VariantClassesTable[props.variant];

    return { variantClasses, additionalClasses: props.class };
  },
});
</script>
