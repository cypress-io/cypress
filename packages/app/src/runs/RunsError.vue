<template>
  <div class="flex flex-col h-full text-center justify-center items-center">
    <i-cy-locked-project_x48
      v-if="icon === 'access'"
      class="h-[48px] w-[48px] icon-dark-gray-500 icon-light-gray-100 icon-dark-secondary-jade-400 icon-light-secondary-jade-200"
    />
    <i-cy-dashboard-fail_x48
      v-if="icon === 'error'"
      class="h-[48px] w-[48px] icon-dark-gray-500 icon-light-gray-100 icon-dark-secondary-red-500 icon-light-secondary-red-300"
    />
    <h2 class="mt-[24px] mb-[4px] text-gray-900 text-[18px] leading-[24px] w-[640px]">
      {{ message }}
    </h2>
    <p class="mb-[24px] text-gray-600 text-[16px] leading-[24px] w-[672px]">
      <slot />
    </p>
    <Button
      :prefix-icon="buttonIcon"
      prefix-icon-class="icon-dark-white icon-light-transparent"
      :disabled="buttonDisabled"
      @click="emit('button-click')"
    >
      {{ buttonText }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'
import Button from '@cy/components/Button.vue'

defineProps<{
  icon: 'access' | 'error'
  message: string
  buttonText: string
  buttonIcon: FunctionalComponent<SVGAttributes, {}>
  buttonDisabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'button-click'): void
}>()
</script>
