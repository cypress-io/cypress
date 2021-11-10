<template>
  <div
    class="sticky top-0 flex items-center justify-between bg-white rounded-t border-b-1px border-b-gray-100 min-h-56px px-24px z-1"
  >
    <DialogTitle class="text-gray-900 text-18px">
      <slot /> <span
        v-if="helpLink.length"
        class="inline-block border-t border-t-gray-100 w-32px h-6px mx-8px"
      /> <ExternalLink
        v-if="helpLink.length"
        :href="helpLink"
        class="text-indigo-500 group outline-transparent text-16px"
      >
        <span class="group-hocus:underline">{{ helpText }}</span>
        <i-cy-circle-bg-question-mark_x16 class="relative inline-block icon-dark-indigo-500 icon-light-indigo-100 -top-2px ml-8px" />
      </ExternalLink>
    </DialogTitle>
    <button
      aria-label="Close"
      class="border-transparent rounded-full p-5px border-1 hover:border-indigo-300 hocus-default"
      @click="$emit('close')"
    >
      <i-cy-delete_x12 class="icon-dark-gray-400 w-12px h-12px m-4px" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { DialogTitle } from '@headlessui/vue'
import ExternalLink from '../gql-components/ExternalLink.vue'

defineProps<{
  helpLink: string,
  helpText: string
}>()

defineEmits<{
  (eventName: 'close'): void
}>()
</script>
