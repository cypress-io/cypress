<template>
  <div>
    <div
      class="flex items-center w-full text-left rounded py-12px"
      :class="props.class"
    >
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
        <p class="text-indigo-500 whitespace-nowrap">
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
        class="flex items-center px-16px"
      >
        <slot name="right" />
      </div>
    </div>
    <slot
      v-if="$slots.bottom"
      name="bottom"
    />
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'

const props = defineProps<{
  class?: string | string[] | Record<string, any>
  description?: string
  icon?: FunctionalComponent<SVGAttributes>
}>()
</script>
