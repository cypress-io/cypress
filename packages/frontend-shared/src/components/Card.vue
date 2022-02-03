<template>
  <div
    class="rounded cursor-pointer h-auto outline-none border-1
      text-center block group focus-within-default hocus-default
      children:hyphens-manual"
    :class="{
      'bg-gray-50 border-gray-100 pointer-events-none': disabled
    }"
    data-cy="card"
    @click="emits('click')"
  >
    <div
      class="mx-auto children:transition-all children:duration-300"
      :class="`w-${iconSize}px h-${iconSize}px mb-${iconMargin}px`"
    >
      <component
        :is="hoverIcon"
        v-if="hoverIcon"
        class="opacity-0 absolute group-focus-within:opacity-100 group-hover:opacity-100"
        :class="iconClass"
        data-cy="card-icon"
      />
      <component
        :is="icon"
        class="opacity-100"
        :class="[ hoverIcon ? 'group-hover:opacity-0' : undefined,
                  iconClass]
        "
        data-cy="card-icon"
      />
    </div>
    <!-- this button can be focused via tab key and allows card hocus styles to appear
    as well as allows a keyboard user to "activate" the card with spacebar or enter keys -->
    <button
      class="m-8px text-indigo-500 text-18px leading-24px focus:outline-transparent"
      :class="{
        'text-gray-700': disabled
      }"
      :disabled="disabled"
    >
      {{ title }}
    </button>
    <p class="tracking-tight text-gray-600 text-14px leading-20px">
      {{ description }}
    </p>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import { computed, FunctionalComponent, SVGAttributes } from 'vue'

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
