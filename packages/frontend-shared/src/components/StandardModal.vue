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
        <StandardModalHeader
          :help-link="helpLink"
          :help-text="helpText"
          @close="closeModal"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </StandardModalHeader>

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
import StandardModalHeader from './StandardModalHeader.vue'
import StandardModalBody from './StandardModalBody.vue'
import StandardModalFooter from './StandardModalFooter.vue'

import {
  Dialog,
  DialogOverlay,
  DialogDescription,
} from '@headlessui/vue'

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const props = withDefaults(defineProps<{
  modelValue?: boolean
  helpLink?: string
  closeCallback?: () => any
  helpText?: string
  clickOutside?: boolean
  variant?: 'bare'
  title?: string,
  class?: string | string[] | Record<string, any>
}>(), {
  clickOutside: true,
  modelValue: false,
  helpText: 'Need help?',
  helpLink: 'https://docs.cypress.io',
  class: undefined,
  variant: undefined,
  title: '',
  closeCallback: undefined,
})

const setIsOpen = (val: boolean) => {
  emit('update:modelValue', val)
}

const closeModal = () => {
  props.closeCallback?.()
  setIsOpen(false)
}

</script>
