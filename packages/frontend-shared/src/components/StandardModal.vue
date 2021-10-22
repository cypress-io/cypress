<template>
  <Dialog
    :open="modelValue"
    class="fixed inset-0 z-10 overflow-y-auto"
    @close="clickOutside && setIsOpen(false)"
  >
    <div class="flex items-center justify-center min-h-screen">
      <slot
        name="overlay"
        :classes="'fixed inset-0'"
      >
        <DialogOverlay class="fixed inset-0 bg-gray-800 opacity-90" />
      </slot>

      <div
        class="relative mx-auto bg-white rounded"
        :class="props.class || ''"
      >
        <div
          class="sticky top-0 flex items-center justify-between bg-white rounded-t border-b-1px border-b-gray-100 min-h-56px px-24px z-1"
        >
          <DialogTitle class="text-gray-900 text-18px">
            <slot name="title" /> <span class="inline-block border-t border-t-gray-100 w-32px h-6px mx-8px" /> <a
              :href="helpLink"
              target="_blank"
              class="text-indigo-500 group outline-transparent text-16px"
            >
              <span class="group-hocus:underline">{{ helpText }}</span>
              <i-cy-circle-bg-question-mark_x16 class="relative inline-block icon-dark-indigo-500 icon-light-indigo-100 -top-2px ml-8px" /></a>
          </DialogTitle>
          <button
            aria-label="Close"
            class="border-transparent rounded-full p-5px border-1 hover:border-indigo-300 hocus-default"
            @click="setIsOpen(false)"
          >
            <i-cy-delete_x12 class="icon-dark-gray-400 w-12px h-12px m-4px" />
          </button>
        </div>

        <DialogDescription
          v-if="$slots.description"
          class="font-normal text-gray-700 p-24px"
        >
          <slot name="description" />
        </DialogDescription>
        <StandardModalBody :variant="variant">
          <slot />
        </StandardModalBody>
        <StandardModalFooter v-if="$slots.footer">
          <slot name="footer" />
        </StandardModalFooter>
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts">
export const inheritAttrs = false
</script>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import StandardModalBody from './StandardModalBody.vue'
import StandardModalFooter from './StandardModalFooter.vue'

import {
  Dialog,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue'

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const props = withDefaults(defineProps<{
  modelValue?: boolean
  helpLink?: string
  helpText?: string
  clickOutside?: boolean
  variant?: 'bare'
  class?: string | string[] | Record<string, any>
}>(), {
  clickOutside: true,
  modelValue: false,
  helpText: 'Need help?',
  helpLink: 'https://docs.cypress.io',
  class: undefined,
})

const setIsOpen = (val: boolean) => {
  emit('update:modelValue', val)
}

</script>
