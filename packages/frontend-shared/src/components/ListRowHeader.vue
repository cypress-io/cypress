<template>
  <div
    class="flex items-center w-full text-left rounded py-10px"
    :class="gray ? 'bg-gray-50' : undefined"
  >
    <div class="flex items-center h-10 px-5">
      <slot name="icon">
        <component
          :is="icon"
          class="w-24px h-24px"
        />
      </slot>
    </div>
    <div class="flex-grow px-3 h-auto border-l border-l-gray-100">
      <p class="text-indigo-500 whitespace-nowrap min-h-6">
        <slot name="header" />
      </p>
      <p class="text-sm font-light select-none text-gray-500">
        <slot name="description">
          <span>{{ description }}</span>
        </slot>
      </p>
    </div>
    <div
      v-if="$slots.right"
      class="flex items-center px-4"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'

defineProps<{
  description?: string
  icon?: FunctionalComponent<SVGAttributes>
  gray?: boolean
}>()

const gray = true
</script>
