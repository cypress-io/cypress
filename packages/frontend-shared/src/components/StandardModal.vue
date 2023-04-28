<template>
  <Dialog
    :open="modelValue"
    class="inset-0 z-10 fixed overflow-y-auto"
    @close="closeModal()"
  >
    <div class="flex min-h-screen items-center justify-center">
      <slot
        name="overlay"
        :classes="'fixed inset-0'"
      >
        <DialogOverlay class="bg-gray-800 opacity-90 fixed sm:inset-0" />
      </slot>
      <div
        data-cy="standard-modal"
        class="bg-white rounded mx-auto ring-[#9095AD40] ring-4 relative"
        :class="props.class || ''"
      >
        <StandardModalHeader
          :no-help="noHelp"
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
          class="font-normal p-[24px] text-gray-700"
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

import { hideAllPoppers } from 'floating-vue'
import { watch } from 'vue'

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
  variant?: 'bare'
  noHelp?: boolean
  title?: string
  class?: string | string[] | Record<string, any>
}>(), {
  modelValue: false,
  helpText: `${defaultMessages.links.needHelp}`,
  noHelp: false,
  helpLink: 'https://on.cypress.io',
  class: undefined,
  variant: undefined,
  title: '',
})

const setIsOpen = (val: boolean) => {
  emit('update:modelValue', val)
}

// Ensure all tooltips are closed when the modal opens - this prevents tooltips from beneath that
// are stuck open being rendered on top of the modal due to the use of a fixed z-index in `floating-vue`
watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      hideAllPoppers()
    }
  },
  { immediate: true },
)

const closeModal = () => {
  setIsOpen(false)
}
</script>
