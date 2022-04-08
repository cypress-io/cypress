<template>
  <Tooltip>
    <slot />
    <template #popper>
      <slot name="popper" />
    </template>
  </Tooltip>
</template>

<script setup lang="ts">
import { Tooltip } from 'floating-vue'

withDefaults(defineProps<{
  color?: string
}>(), {
  color: 'dark',
})

</script>

<style lang="scss">
@import "floating-vue/dist/style.css";

.v-popper__popper.v-popper--theme-tooltip {
  .v-popper__inner {
    @apply bg-gray-900 py-2 px-4;
  }
  .v-popper__arrow-inner,
  .v-popper__arrow-outer {
    // NOTE: we can't use @apply to here because having !important breaks things
    border-color: #2e3247;
  }

  &[data-popper-placement="bottom"] {
    .v-popper__wrapper {
      transform: scaleY(0);
      @apply origin-top transition-transform;
    }

    &.v-popper__popper.v-popper__popper--show-to .v-popper__wrapper {
      transform: scaleY(1);
    }
  }

  &[data-popper-placement="right"] {
    .v-popper__wrapper {
      transform: scaleX(0);
      @apply origin-left transition-transform;
    }

    &.v-popper__popper.v-popper__popper--show-to .v-popper__wrapper {
      transform: scaleX(1);
    }
  }
}

</style>
