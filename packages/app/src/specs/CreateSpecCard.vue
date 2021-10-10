<template>
  <div
    role="button"
    class="block h-auto overflow-scroll text-center rounded w-280px min-h-216px max-h-350px p-32px children:hyphens-manual border-1 hocus-default"
    tabindex="0"
  >
    <component
      :is="icon"
      class="mx-auto my-0 w-48px h-48px icon-dark-indigo-400 icon-light-indigo-100 icon-light-secondary-jade-200 icon-dark-secondary-jade-400"
      data-testid="create-spec-card-icon"
    />
    <h2 class="leading-normal text-indigo-500 mt-10px text-18px mb-4px">
      {{ header }}
    </h2>
    <p class="font-light text-gray-500 text-14px leading-[20px]">
      {{ description }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'

defineProps<{
  icon: FunctionalComponent<SVGAttributes>,
  header: string,
  description: string
}>()
</script>
