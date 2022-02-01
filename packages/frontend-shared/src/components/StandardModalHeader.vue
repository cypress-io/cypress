<template>
  <div
    class="bg-white rounded-t flex border-b-1px border-b-gray-100 min-h-56px px-24px top-0 z-1 sticky items-center justify-between"
  >
    <div>
      <DialogTitle class="text-gray-900 text-18px inline-block">
        <slot />
      </DialogTitle>
      <span
        v-if="helpLink.length"
        class="border-t border-t-gray-100 h-6px mx-8px w-32px inline-block"
      /> <ExternalLink
        v-if="helpLink.length"
        :href="helpLink"
        class="outline-transparent text-indigo-500 text-16px group"
      >
        <span class="group-hocus:underline">{{ helpText }}</span>
        <i-cy-circle-bg-question-mark_x16 class="ml-8px -top-2px relative inline-block icon-dark-indigo-500 icon-light-indigo-100" />
      </ExternalLink>
    </div>
    <button
      :aria-label="t(`actions.close`)"
      class="border-transparent rounded-full border-1 p-5px hocus-default hover:border-indigo-300"
      @click="$emit('close')"
    >
      <i-cy-delete_x12 class="h-12px m-4px w-12px icon-dark-gray-400" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { DialogTitle } from '@headlessui/vue'
import ExternalLink from '../gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineProps<{
  helpLink: string,
  helpText: string
}>()

defineEmits<{
  (eventName: 'close'): void
}>()
</script>
