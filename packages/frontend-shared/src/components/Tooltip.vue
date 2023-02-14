<template>
  <component
    :is="isInteractive? Menu : Tooltip"
    v-if="!disabled"
    :popper-class="actualPopperClass"
    :theme="theme"
    :placement="placement ?? 'auto'"
    :distance="distance"
    :skidding="skidding"
    :auto-hide="false /* to prevent the popper from getting focus */"
    :delay="{show: showDelay, hide: hideDelay }"
    :show-group="showGroup"
  >
    <slot />
    <template
      #popper="{ shown, hide }"
    >
      <slot
        name="popper"
        :shown="shown"
        :hide="hide"
      />
    </template>
  </component>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tooltip, Menu, options } from 'floating-vue'

// Override default of 5000 so that DOM elements are disposed immediately when tooltip closes
options.disposeTimeout = 0

const props = withDefaults(defineProps<{
  color?: 'dark' | 'light'
  hideArrow?: boolean
  disabled?: boolean
  isInteractive?: boolean
  distance?: number
  skidding?: number
  placement?: 'top' | 'right' | 'bottom' | 'left'
  popperClass?: string
  showDelay?: number
  hideDelay?: number
  instantMove?: boolean
  showGroup?: string
}>(), {
  color: undefined,
  hideArrow: false,
  disabled: false,
  isInteractive: false,
  distance: undefined,
  skidding: undefined,
  placement: undefined,
  popperClass: undefined,
  showDelay: 0,
  hideDelay: 100,
  instantMove: undefined,
  showGroup: undefined,
})

const theme = computed(() => {
  return props.isInteractive ? 'menu' : 'tooltip'
})

const actualPopperClass = computed(() => {
  const result: string[] = props.popperClass ? [props.popperClass] : []

  if (props.hideArrow) {
    result.push('no-arrow')
  }

  // color takes priority, else fallback to tooltip -> dark, menu -> light
  if (props.color === 'dark') {
    result.push('cypress-v-tooltip-dark')
  } else if (props.color === 'light') {
    result.push('cypress-v-tooltip-light')
  } else if (!props.isInteractive) {
    result.push('cypress-v-tooltip-dark')
  } else {
    result.push('cypress-v-tooltip-light')
  }

  return result
})

</script>

<style lang="scss">
@import "floating-vue/dist/style.css";
.no-arrow {
  .v-popper__arrow-container {
    @apply hidden;
  }
}

.cypress-v-tooltip-dark {
  .v-popper__inner {
    @apply bg-gray-900 border-0 text-white py-2 px-4;
  }
  .v-popper__arrow-outer {
    // NOTE: we can't use @apply to here because having !important breaks things
    border-color: #2e3247;
  }

  .v-popper__arrow-inner{
    visibility: hidden;
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

.cypress-v-tooltip-light {
  .v-popper__inner {
    @apply bg-white text-black;
    border-color: transparent;
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
