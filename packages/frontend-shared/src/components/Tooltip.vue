<template>
  <Tooltip
    v-if="!disabled"
    :popper-class="{'no-arrow': hideArrow}"
    :popper-triggers="['hover']"
    :hide-triggers="['hover']"
    :auto-hide="!isInteractive"
    :theme="theme"
  >
    <slot />
    <template
      #popper
    >
      <slot
        name="popper"
      />
    </template>
  </Tooltip>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FloatingVue, { Tooltip } from 'floating-vue'

export type InteractiveHighlightColor = 'INDIGO'|'ORANGE'|'RED'|'GRAY'|'JADE'

const props = withDefaults(defineProps<{
  color?: string
  hideArrow?: boolean
  disabled?: boolean
  isInteractive?: boolean
  interactiveHighlightColor?: InteractiveHighlightColor
}>(), {
  color: 'dark',
  hideArrow: false,
  disabled: false,
  isInteractive: false,
  interactiveHighlightColor: undefined,
})

FloatingVue.options.themes['interactive'] = {
  $extend: 'tooltip',
}

FloatingVue.options.themes['interactive-indigo'] = {
  $extend: 'interactive',
}

FloatingVue.options.themes['interactive-orange'] = {
  $extend: 'interactive',
}

FloatingVue.options.themes['interactive-red'] = {
  $extend: 'interactive',
}

FloatingVue.options.themes['interactive-gray'] = {
  $extend: 'interactive',
}

FloatingVue.options.themes['interactive-jade'] = {
  $extend: 'interactive',
}

const theme = computed(() => {
  if (!props.isInteractive) return 'tooltip'

  switch (props.interactiveHighlightColor) {
    case 'INDIGO':
      return 'interactive-indigo'
    case 'RED':
      return 'interactive-red'
    case 'ORANGE':
      return 'interactive-orange'
    case 'GRAY':
      return 'interactive-gray'
    case 'JADE':
      return 'interactive-jade'
    default:
      return 'interactive'
  }
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
  .v-popper__wrapper {
    }
  .v-popper__inner {
    @apply bg-white border-dark-900 text-black py-2 px-4;
    border-radius: 4px !important;
    // border-color: black;
    // border-width: 1px;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.15);
    padding: 16px;
    max-width: 250px;
  }
  .v-popper__arrow-inner,
  .v-popper__arrow-outer {
    // NOTE: we can't use @apply to here because having !important breaks things
    text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.15);
    // border-radius: 4px;
    border-color: white;
  }
}

.v-popper__popper.v-popper--theme-interactive-indigo {
  .v-popper__inner {
    border-top: 4px solid $indigo-400 !important;
  }
}

.v-popper__popper.v-popper--theme-interactive-orange {
  .v-popper__inner {
    border-top: 4px solid $orange-400 !important;
  }
}

.v-popper__popper.v-popper--theme-interactive-red {
  .v-popper__inner {
    border-top: 4px solid $red-400 !important;
  }
}

.v-popper__popper.v-popper--theme-interactive-gray {
  .v-popper__inner {
    border-top: 4px solid $gray-300 !important;
  }
}

.v-popper__popper.v-popper--theme-interactive-jade {
  .v-popper__inner {
    border-top: 4px solid $jade-400 !important;
  }
}

</style>
