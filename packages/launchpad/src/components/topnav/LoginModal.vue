<template>
  <Dialog
    :open="modelValue"
    class="fixed inset-0 z-10 overflow-y-auto"
    @close="setIsOpen"
  >
    <div class="flex items-center justify-center min-h-screen">
      <DialogOverlay class="fixed inset-0 bg-gray-800 opacity-90" />

      <div class="relative w-480px mx-auto bg-white rounded">
        <div class="border-b-1px min-h-64px flex justify-between items-center px-24px">
          <DialogTitle class="text-gray-900 text-18px">
            Login To Cypress
          </DialogTitle>
          <button @click="setIsOpen(false)">
            Close
          </button>
        </div>

        <DialogDescription class="p-24px text-gray-700 font-normal">
          Logging in gives you access to the
          <a
            href="https://on.cypress.io/dashboard"
            target="_blank"
          >Cypress Dashboard Service</a>. You can set up projects to be recorded and see test data from your project.
        </DialogDescription>

        <div class="border-t-1px px-24px py-16px bg-gray-50">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Dialog>
</template>
<script setup lang="ts">

import {
  Dialog,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue'

const setIsOpen = (value) => {
  emit('update:modelValue', value)
}

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const props = defineProps<{
  modelValue: boolean
}>()

</script>
