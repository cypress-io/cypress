<template>
  <button :disabled="disabled" :class="className">
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  props: {
    primary: Boolean,
    outline: Boolean,
    disabled: Boolean,
  },
  setup(props) {
    const className = computed(() => {
      return {
        base: true,
        primary: props.primary,
        outline: props.outline,
        disabled: props.disabled,
      };
    });

    return {
      className,
    };
  },
});
</script>

<style lang="scss" scoped>
.base {
  @apply m-5
    px-4
    py-2;
}
.disabled {
 @apply opacity-50;
}
.outline {
  @apply text-blue-500 rounded border-blue-500 border-1 border-inset;
}
.primary {
  @apply bg-blue-500 text-white rounded;
}
</style>