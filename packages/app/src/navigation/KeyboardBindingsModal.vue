<template>
  <StandardModal
    class="transition transition-all duration-200"
    variant="bare"
    title="Keyboard shortcuts"
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
        <template
          v-for="(key, index) in binding.key"
          :key="`${binding.key.join('-')}-${index}`"
        >
          <span
            v-if="key === '+'"
            class="mx-[4px] text-gray-700 text-[14px] leading-[20px]"
          >
            {{ key }}
          </span>
          <span
            v-else
            :class="[
              'border rounded-sm bg-gray-50 border-gray-100 h-[24px] text-center text-indigo-500 text-[14px] leading-[20px] min-w-[24px] px-[6px] inline-flex items-center justify-center',
              index > 0 && binding.key[index - 1] === '+' ? 'ml-[4px]' : 'ml-[8px]'
            ]"
          >
            {{ key }}
          </span>
        </template>
      </li>
    </ul>
  </StandardModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import StandardModal from '@cy/components/StandardModal.vue'
import { getRunnerConfigFromWindow } from '../runner/get-runner-config-from-window'

defineProps<{
  show: boolean
}>()

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

const platform = computed(() => {
  try {
    return getRunnerConfigFromWindow().platform
  } catch {
    // Fallback to darwin if platform is not available (e.g., during tests)
    return 'darwin'
  }
})

const isDarwin = computed(() => platform.value === 'darwin')

const keyBindings = computed(() => {
  return [
    {
      key: ['r'],
      description: 'Re-run tests',
    },
    {
      key: ['s'],
      description: 'Stop tests',
    },
    {
      key: ['f'],
      description: 'Toggle specs list',
    },
    {
      key: isDarwin.value ? ['⌘', '+', 's'] : ['Ctrl', '+', 's'],
      description: 'Save Studio changes',
    },
  ]
})
</script>
