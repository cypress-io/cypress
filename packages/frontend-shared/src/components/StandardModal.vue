<template>
  <Dialog
    :open="localValue"
    class="fixed inset-0 z-10 overflow-y-auto"
    @close="setIsOpen(false)"
  >
    <div class="flex items-center justify-center min-h-screen">
      <DialogOverlay class="fixed inset-0 bg-gray-800 opacity-90" />

      <div
        class="relative mx-auto bg-white rounded"
        :class="modalClasses"
      >
        <div class="flex items-center justify-between border-b-1px min-h-64px px-24px">
          <DialogTitle class="text-gray-900 text-18px">
            <slot name="title" /> - <a
              :href="helpLink"
              target="_blank"
              class="text-indigo-500"
            >{{ helpText }}</a>
          </DialogTitle>
          <button
            aria-label="Close"
            class="hocus-default"
            @click="setIsOpen(false)"
          >
            <i-cy-delete_x12 class="icon-dark-gray-400 w-12px h-12px" />
          </button>
        </div>

        <DialogDescription
          v-if="$slots.description"
          class="font-normal text-gray-700 p-24px"
        >
          <slot name="description" />
        </DialogDescription>
        <slot />

        <div
          v-if="$slots.footer"
          class="border-t-1px px-24px py-16px bg-gray-50"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { useI18n } from '@cy/i18n'

import { useModelWrapper } from '@packages/frontend-shared/src/composables'

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
  activatorText?: string
  width?: string,
  modalClasses?: string
  helpLink?: string
  helpText?: string
}>(), {
  modelValue: false,
  activatorText: '',
  modalClasses: 'w-480px',
  helpText: 'Need help?',
  helpLink: 'https://docs.cypress.io',
})

const localValue = useModelWrapper(props, emit, 'modelValue')

const setIsOpen = (val: boolean) => {
  emit('update:modelValue', val)
}

const { t } = useI18n()

</script>
