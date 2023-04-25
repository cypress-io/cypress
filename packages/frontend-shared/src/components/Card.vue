<template>
  <div
    class="relative block h-auto text-center border border-gray-100 rounded outline-none group children:hyphens-manual"
    :class="{
      'bg-gray-50 cursor-default': disabled,
      'cursor-pointer focus-within-default hocus-default': !disabled
    }"
    data-cy="card"
    @click="!disabled && emits('click')"
  >
    <div
      v-if="badgeText"
      class="absolute top-0 right-0 text-teal-600 ribbon"
      aria-hidden="true"
    >
      {{ badgeText }}
    </div>
    <div
      class="mx-auto children:transition-all children:duration-300"
      :class="classes"
    >
      <component
        :is="hoverIcon"
        v-if="hoverIcon"
        class="absolute opacity-0"
        :class="[iconClass, {'group-hover:opacity-100 group-focus:opacity-100': !disabled}]"
        data-cy="card-icon"
      />
      <component
        :is="icon"
        class="opacity-100"
        :class="[ hoverIcon && !disabled ? 'group-hover:opacity-0' : undefined,
                  iconClass]
        "
        data-cy="card-icon"
      />
    </div>
    <!-- this button can be focused via tab key and allows card hocus styles to appear
    as well as allows a keyboard user to "activate" the card with spacebar or enter keys -->
    <button
      class="font-medium mx-[8px] mb-[8px] text-[18px] leading-[24px] focus:outline-transparent"
      :class="{
        'text-gray-700 cursor-default': disabled,
        'text-indigo-500': !disabled
      }"
      :disabled="disabled"
    >
      {{ title }}
    </button>
    <p class="tracking-tight text-gray-600 text-[14px] leading-[20px]">
      <slot>{{ description }}</slot>
    </p>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  description: string
  icon: FunctionalComponent<SVGAttributes, {}>
  hoverIcon?: FunctionalComponent<SVGAttributes, {}>
  variant: 'indigo' | 'jade'
  iconSize: 64 | 48
  disabled?: boolean
  badgeText?: string
}>(), {
  disabled: false,
  hoverIcon: undefined,
  badgeText: '',
})

const classMap = {
  indigo: 'icon-dark-indigo-400 icon-light-indigo-100 icon-light-secondary-jade-200 icon-dark-secondary-jade-400',
  jade: 'icon-dark-jade-400 icon-light-jade-100',
}

const iconDimensions = computed(() => {
  return props.iconSize === 48
    ? `w-[48px] h-[48px]`
    : `w-[64px] h-[64px]`
})

const classes = computed(() => {
  const iconMargin = props.iconSize === 64 ? 'mb-[32px]' : 'mb-[8px]'

  return [iconDimensions.value, iconMargin]
})

const iconClass = computed(() => {
  const colorClass = props.disabled
    ? 'icon-dark-gray-600 icon-light-gray-100 icon-dark-secondary-gray-600 icon-light-secondary-gray-300'
    : classMap[props.variant]

  return [iconDimensions.value, colorClass].join(' ')
})

const emits = defineEmits<{
  (event: 'click'): void
}>()
</script>

<style scoped>
.ribbon {
  /* https://css-tricks.com/the-shapes-of-css/#aa-trapezoid-shape */
  transform: rotate(45deg);
  border-bottom: 25px solid #C2F1DE; /* Primary/Jade/100 */
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  height: 10px;
  width: 100px;
  top: 14px !important;
  right: -24px !important;
}
</style>
