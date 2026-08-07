<template>
  <div class="rounded-b flex bg-gray-50 border-t border-t-gray-100 py-[16px] px-[24px] gap-3">
    <slot>
      <Button
        v-if="nextFn"
        size="40"
        :disabled="!canNavigateForward"
        :variant="mainVariant"
        data-cy="next-button"
        @click="nextFn"
      >
        {{ next }}
      </Button>
      <Button
        v-if="backFn"
        size="40"
        variant="outline-light"
        data-cy="back-button"
        @click="backFn"
      >
        {{ back }}
      </Button>
      <div class="grow" />
      <Button
        v-if="skipFn"
        size="40"
        variant="link"
        class="text-gray-500"
        data-cy="skip-button"
        @click="skipFn"
      >
        {{ skip }}
        <i-cy-arrow-right_x16 class="inline-block h-[16px] w-[16px] icon-dark-gray-500" />
      </Button>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import Button, { type ButtonVariants } from '@cypress-design/vue-button'

withDefaults(defineProps<{
  next?: string
  back?: string
  skip?: string
  nextFn?: () => void
  backFn?: () => void
  skipFn?: () => void
  canNavigateForward?: boolean
  mainVariant?: ButtonVariants
}>(), {
  next: undefined,
  back: undefined,
  skip: undefined,
  backFn: undefined,
  nextFn: undefined,
  skipFn: undefined,
  mainVariant: 'indigo-dark',
})
</script>
