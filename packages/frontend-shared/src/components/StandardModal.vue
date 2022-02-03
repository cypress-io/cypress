<template>
  <Dialog
    :open="modelValue"
    class="inset-0 z-10 fixed overflow-y-auto"
    @close="clickOutside && closeModal()"
  >
    <div class="flex min-h-screen items-center justify-center">
      <slot
        name="overlay"
        :classes="'fixed inset-0'"
      >
        <DialogOverlay class="bg-gray-800 opacity-90 inset-0 fixed" />
      </slot>
      <div
        data-cy="standard-modal"
        class="bg-white rounded mx-auto ring-[#9095AD40] ring-4 relative"
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
          class="font-normal p-24px text-gray-700"
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

import { defaultMessages } from '@cy/i18n'

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const props = withDefaults(defineProps<{
  modelValue?: boolean
  helpLink?: string
  helpText?: string
  clickOutside?: boolean
  variant?: 'bare'
  title?: string
  class?: string | string[] | Record<string, any>
}>(), {
  clickOutside: true,
  modelValue: false,
  helpText: `${defaultMessages.links.needHelp}`,
  helpLink: 'https://on.cypress.io',
  class: undefined,
  variant: undefined,
  title: '',
})

const setIsOpen = (val: boolean) => {
  emit('update:modelValue', val)
}

const closeModal = () => {
  setIsOpen(false)
}
</script>
