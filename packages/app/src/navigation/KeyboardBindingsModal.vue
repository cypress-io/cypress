<template>
  <StandardModal
    class="transition transition-all duration-200"
    variant="bare"
    :title="t('sidebar.keyboardShortcuts.title')"
    :model-value="show"
    data-cy="keyboard-modal"
    :no-help="true"
    @update:model-value="emits('close')"
  >
    <ul class="m-[24px] w-[384px]">
      <li
        v-for="binding in keyBindings"
        :key="binding.key.join('-')"
        class="flex h-[24px] my-[16px] items-center"
      >
        <p class="grow text-gray-700 text-[16px] leading-[24px]">
          {{ binding.description }}
        </p>
        <span
          v-for="key in binding.key"
          :key="key"
          class="border rounded-sm bg-gray-50 border-gray-100 h-[24px] text-center ml-[8px] text-indigo-500 text-[14px] leading-[20px] w-[24px] inline-block"
        >
          {{ key }}
        </span>
      </li>
    </ul>
  </StandardModal>
</template>

<script lang="ts" setup>
import StandardModal from '@cy/components/StandardModal.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineProps<{
  show: boolean
}>()

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

const keyBindings = [
  {
    key: ['r'],
    description: t('sidebar.keyboardShortcuts.rerun'),
  },
  {
    key: ['s'],
    description: t('sidebar.keyboardShortcuts.stop'),
  },
  {
    key: ['f'],
    description: t('sidebar.keyboardShortcuts.toggle'),
  },
]
</script>
