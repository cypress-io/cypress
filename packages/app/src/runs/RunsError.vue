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
      :disabled="buttonDisabled"
      @click="emit('button-click')"
    >
      <IconForButton class="icon-dark-white icon-light-transparent mr-[8px]" />
      {{ buttonText }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, type FunctionalComponent, type SVGAttributes } from 'vue'
import Button from '@cypress-design/vue-button'

const props = defineProps<{
  icon: 'access' | 'error'
  message: string
  buttonText: string
  buttonIcon: FunctionalComponent<SVGAttributes, {}>
  buttonDisabled?: boolean
}>()

const IconForButton = computed(() => props.buttonIcon ?? undefined)

const emit = defineEmits<{
  (event: 'button-click'): void
}>()
</script>
