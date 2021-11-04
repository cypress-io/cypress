<template>
  <div class="flex items-center w-full text-left rounded py-12px">
    <div class="flex items-center h-40px px-24px">
      <slot name="icon">
        <component
          :is="icon"
          class="w-24px h-24px"
        />
      </slot>
    </div>
    <div class="h-40px w-1px bg-gray-100" />
    <div class="flex-grow px-16px h-auto">
      <h2
        class="text-indigo-500 whitespace-nowrap"
        :class="{'text-size-18px': bigHeader}"
      >
        <slot name="header" />
      </h2>
      <p class="text-sm font-light select-none text-gray-500">
        <slot name="description">
          <span>{{ description }}</span>
        </slot>
      </p>
    </div>
    <div
      v-if="slots.right"
      class="flex items-center px-16px"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FunctionalComponent, SVGAttributes, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  description?: string
  icon?: FunctionalComponent<SVGAttributes>
  gray?: boolean
  bigHeader?: boolean
}>(), {
  description: undefined,
  icon: undefined,
  gray: false,
  bigHeader: false,
})

const slots = useSlots()

const gray = true
</script>
