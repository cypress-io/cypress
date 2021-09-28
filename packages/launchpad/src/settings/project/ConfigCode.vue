<template>
  <div class="relative grow-1 w-full hide-scrollbar rounded-bl-md rounded-tl-md mx-auto border-1 overflow-hidden min-w-100px select-none">
    <Button
      variant="outline"
      class="absolute top-4 right-4"
      :prefixIcon="IconCode"
      prefixIconClass="text-gray-500"
    >{{ t('file.edit') }}</Button>
    <pre @dblclick="copy(code)" class="p-2 font-mono text-gray-600 text-sm">{{ code }}</pre>
    <div
      aria-hidden="true"
      class="pointer-events-none flex items-center text-center transition-opacity absolute top-0 left-0 w-full h-full"
      :class="copied ? 'opacity-100' : 'opacity-0'"
    >
      <div class="w-full mb-80">
        <span
          class="px-2 rounded text-white bg-indigo-600 shadow-md py-1 text-sm"
        >{{ t('clipboard.copied') }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'
import IconCode from '~icons/mdi/code'
import { useI18n } from '@cy/i18n'
import { useClipboard } from '@vueuse/core'

defineProps<{
  code: string,
  mockCopy?: () => any
}>()

const { copy, copied } = useClipboard()
const { t } = useI18n()
</script>
