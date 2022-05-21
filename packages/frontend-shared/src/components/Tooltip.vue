<template>
  <Tooltip
    v-if="!disabled"
    :popper-class="{'no-arrow': hideArrow}"
    :popper-triggers="['hover']"
    :hide-triggers="['hover']"
    :auto-hide="!isInteractive"
    :theme="theme"
    :placement="placement ?? 'auto'"
  >
    <slot />
    <template #popper>
      <slot name="popper" />
    </template>
  </Tooltip>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FloatingVue, { Tooltip } from 'floating-vue'

const props = withDefaults(defineProps<{
  color?: string
  hideArrow?: boolean
  disabled?: boolean
  isInteractive?: boolean
  placement?: 'top' | 'right' | 'bottom' | 'left'
}>(), {
  color: 'dark',
  hideArrow: false,
  disabled: false,
  isInteractive: false,
  placement: undefined,
})

FloatingVue.options.themes['interactive'] = {
  $extend: 'tooltip',
}

const theme = computed(() => {
  return props.isInteractive ? 'interactive' : 'tooltip'
})

</script>

<style lang="scss">
@import "floating-vue/dist/style.css";
.no-arrow {
  .v-popper__arrow-container {
    @apply hidden;
  }
}

.v-popper__popper.v-popper--theme-tooltip {
  .v-popper__inner {
    @apply bg-gray-900 py-2 px-4;
  }
  .v-popper__arrow-inner,
  .v-popper__arrow-outer {
    // NOTE: we can't use @apply to here because having !important breaks things
    border-color: #2e3247;
  }

  &[data-popper-placement="top"] {
    .v-popper__wrapper {
      transform: scaleY(0);
      @apply origin-bottom transition-transform;
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

  &[data-popper-placement="bottom"] {
    .v-popper__wrapper {
      transform: scaleY(0);
      @apply origin-top transition-transform;
    }

    &.v-popper__popper.v-popper__popper--show-to .v-popper__wrapper {
      transform: scaleY(1);
    }
  }

  &[data-popper-placement="left"] {
    .v-popper__wrapper {
      transform: scaleX(0);
      @apply origin-right transition-transform;
    }

    &.v-popper__popper.v-popper__popper--show-to .v-popper__wrapper {
      transform: scaleX(1);
    }
  }
}

.v-popper__popper.v-popper--theme-interactive {
  .v-popper__inner {
    @apply bg-white border-dark-900 text-black;
    border-radius: 4px !important;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.15);
    padding: 0;
  }

  .v-popper__arrow-outer {
    border-color: white;
  }

  &[data-popper-placement="top"] {
    .v-popper__arrow-outer {
      filter: drop-shadow(0 1px 1px $gray-100);
    }
  }

  &[data-popper-placement="bottom"] {
    .v-popper__arrow-outer {
      filter: drop-shadow(0 -1px 1px $gray-100);
    }
  }

  &[data-popper-placement="left"] {
    .v-popper__arrow-outer {
      filter: drop-shadow(1px 0px 1px $gray-100);
    }
  }

  &[data-popper-placement="right"] {
    .v-popper__arrow-outer {
      filter: drop-shadow(-1px 0px 1px $gray-100);
    }
  }
}

</style>
