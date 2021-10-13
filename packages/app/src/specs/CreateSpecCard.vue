<template>
  <div
  class="block h-auto overflow-scroll text-center rounded outline-none cursor-pointer w-280px m-2px min-h-216px max-h-350px px-32px pt-32px pb-24px children:hyphens-manual border-1 hocus-default focus-within-default"
  data-testid="create-spec-card" tabindex="0"
  >
    <component
      :is="icon"
      class="mx-auto my-0 w-48px h-48px icon-dark-indigo-400 icon-light-indigo-100 icon-light-secondary-jade-200 icon-dark-secondary-jade-400"
      data-testid="create-spec-card-icon"
    />
    <h2 class="leading-normal text-indigo-500 mt-10px text-18px mb-4px">
      <button class="focus:outline-none focus:ring-0">{{ header }}</button>
    </h2>
    <p class="text-gray-500 tracking-tight text-14px leading-[20px]">
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
