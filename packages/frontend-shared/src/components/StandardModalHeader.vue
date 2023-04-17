<template>
  <div
    class="bg-white rounded-t flex border-b-[1px] border-b-gray-100 min-h-[56px] px-[24px] top-0 z-1 sticky items-center justify-between"
  >
    <div>
      <DialogTitle class="text-gray-900 text-[18px] inline-block">
        <slot />
      </DialogTitle>

      <template v-if="!noHelp">
        <span class="border-t border-t-gray-100 h-[6px] mx-[8px] w-[32px] inline-block" />
        <ExternalLink
          :href="helpLink"
          class="outline-transparent text-indigo-500 text-[16px] group"
        >
          <span class="group-hocus:underline">{{ helpText }}</span>
        </ExternalLink>

        <i-cy-circle-bg-question-mark_x16 class="ml-[8px] -top-[2px] relative inline-block icon-dark-indigo-500 icon-light-indigo-100" />
      </template>
    </div>

    <button
      :aria-label="t(`actions.close`)"
      class="border-transparent rounded-full outline-none border group"
      @click="$emit('close')"
    >
      <i-cy-delete_x12 class="h-[12px] w-[12px] icon-dark-gray-400 group-hocus:icon-dark-indigo-400 children:transition-all" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { DialogTitle } from '@headlessui/vue'
import ExternalLink from '../gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

withDefaults(defineProps<{
  helpLink: string
  helpText: string
  noHelp?: boolean
}>(), {
  noHelp: false,
})

defineEmits<{
  (eventName: 'close'): void
}>()
</script>
