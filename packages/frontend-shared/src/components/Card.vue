<template>
  <a
    class="block h-auto text-center rounded outline-none
  cursor-pointer group
  children:hyphens-manual border-1 hocus-default
  focus-within-default"
    :class="{
      'bg-gray-50 border-gray-100 pointer-events-none': disabled
    }"
    data-cy="card"
    :tabindex="disabled ? 0 : undefined"
    @click="emits('click')"
  >
    <div
      class="mx-auto mb-32px children:transition-all children:duration-300"
      :class="`w-${iconSize}px h-${iconSize}px`"
    >
      <component
        :is="hoverIcon"
        v-if="hoverIcon"
        class="absolute opacity-0 group-hover:opacity-100"
        :class="iconClass"
        data-cy="card-icon"
      />
      <component
        :is="icon"
        class="opacity-100 group-hover:opacity-0"
        :class="[ hoverIcon ? 'group-hover:opacity-0' : undefined,
                  iconClass]
        "
        data-cy="card-icon"
      />
    </div>
    <h2
      class="text-indigo-500 m-8px text-18px leading-24px"
      :class="{
        'text-gray-700': disabled
      }"
    >
      {{ title }}
    </h2>
    <p class="text-gray-600 tracking-tight text-14px leading-20px">
      {{ description }}
    </p>
    <slot name="footer" />
  </a>
</template>

<script setup lang="ts">
import { computed, FunctionalComponent, SVGAttributes } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  description: string
  icon: FunctionalComponent<SVGAttributes, {}>
  hoverIcon?: FunctionalComponent<SVGAttributes, {}>
  variant: 'indigo' | 'jade'
  iconSize: '64' | '48'
  disabled?: boolean
}>(), {
  disabled: false,
  hoverIcon: undefined,
})

const classMap = {
  indigo: 'icon-dark-indigo-400 icon-light-indigo-100 icon-light-secondary-jade-200 icon-dark-secondary-jade-400',
  jade: 'icon-dark-jade-400 icon-light-jade-100',
}

const iconClass = computed(() => {
  return [`w-${props.iconSize}px h-${props.iconSize}px`, props.disabled ?
    'icon-dark-gray-600 icon-light-gray-100 icon-dark-secondary-gray-600 icon-light-secondary-gray-300' :
    classMap[props.variant]].join(' ')
})

const emits = defineEmits<{
  (event: 'click'): void
}>()
</script>
