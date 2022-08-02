<template>
  <div
    class="rounded h-auto outline-none border-1 border-gray-100 text-center
      relative block group
      children:hyphens-manual"
    :class="{
      'bg-gray-50 cursor-default': disabled,
      'cursor-pointer focus-within-default hocus-default': !disabled
    }"
    data-cy="card"
    @click="!disabled && emits('click')"
  >
    <div
      v-if="title === t('testingType.component.name')"
      class="top-0 right-0 text-teal-600 ribbon absolute"
      aria-hidden="true"
    >
      {{ t('versions.beta') }}
    </div>
    <div
      class="mx-auto children:transition-all children:duration-300"
      :class="`w-${iconSize}px h-${iconSize}px mb-${iconMargin}px`"
    >
      <component
        :is="hoverIcon"
        v-if="hoverIcon"
        class="opacity-0 absolute"
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
      class="font-medium mx-8px mb-8px text-18px leading-24px focus:outline-transparent"
      :class="{
        'text-gray-700 cursor-default': disabled,
        'text-indigo-500': !disabled
      }"
      :disabled="disabled"
    >
      {{ title }}
    </button>
    <p class="tracking-tight text-gray-600 text-14px leading-20px">
      <slot>{{ description }}</slot>
    </p>
    <slot name="footer" />
    <div
      v-if="title === t('testingType.component.name')"
      class="sr-only"
    >
      Support is in {{ t('versions.beta') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  title: string
  description: string
  icon: FunctionalComponent<SVGAttributes, {}>
  hoverIcon?: FunctionalComponent<SVGAttributes, {}>
  variant: 'indigo' | 'jade'
  iconSize: 64 | 48
  disabled?: boolean
}>(), {
  disabled: false,
  hoverIcon: undefined,
})

const classMap = {
  indigo: 'icon-dark-indigo-400 icon-light-indigo-100 icon-light-secondary-jade-200 icon-dark-secondary-jade-400',
  jade: 'icon-dark-jade-400 icon-light-jade-100',
}

const iconMargin = computed(() => {
  return props.iconSize === 64 ? 32 : 8
})

const iconClass = computed(() => {
  return [`w-${props.iconSize}px h-${props.iconSize}px`, props.disabled ?
    'icon-dark-gray-600 icon-light-gray-100 icon-dark-secondary-gray-600 icon-light-secondary-gray-300' :
    classMap[props.variant]].join(' ')
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
