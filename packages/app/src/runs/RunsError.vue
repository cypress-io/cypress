<template>
  <div class="flex flex-col h-full justify-center items-center text-center">
    <i-cy-locked-project_x48
      v-if="icon === 'access'"
      class="w-48px h-48px icon-dark-gray-500 icon-light-gray-100 icon-dark-secondary-jade-400 icon-light-secondary-jade-200"
    />
    <i-cy-dashboard-fail_x48
      v-if="icon === 'error'"
      class="w-48px h-48px icon-dark-gray-500 icon-light-gray-100 icon-dark-secondary-red-500 icon-light-secondary-red-300"
    />
    <h2 class="w-640px mt-24px mb-4px text-gray-900 text-18px leading-24px">
      {{ message }}
    </h2>
    <p class="w-672px mb-24px text-gray-600 text-16px leading-24px">
      <slot />
    </p>
    <Button
      :prefix-icon="buttonIcon"
      prefix-icon-class="icon-dark-white icon-light-transparent"
      @click="emit('buttonClick')"
    >
      {{ buttonText }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'
import Button from '@cy/components/Button.vue'

defineProps<{
  icon: 'access' | 'error',
  message: string,
  buttonText: string,
  buttonIcon: FunctionalComponent<SVGAttributes, {}>,
}>()

const emit = defineEmits<{
  (event: 'buttonClick'): void,
}>()
</script>
