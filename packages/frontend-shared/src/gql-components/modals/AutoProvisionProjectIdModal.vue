<template>
  <StandardModal
    model-value
    :title="t('runs.connect.modal.autoProvision.title')"
    @update:model-value="emit('close')"
  >
    <div class="w-[640px]">
      <p class="mt-[8px] mb-[16px] text-[16px] leading-[24px] text-gray-700">
        {{ t('runs.connect.modal.autoProvision.body') }}
        <OpenFileInIDE :file-path="props.configFilePath">
          <template #default="{ onClick }">
            <button
              class="text-indigo-500 underline hover:text-indigo-600 ml-[4px]"
              @click="onClick"
            >
              {{ t('runs.connect.modal.autoProvision.openInIDE') }}
            </button>
          </template>
        </OpenFileInIDE>
      </p>
      <div class="flex items-center gap-[8px] border border-gray-200 rounded p-[12px] bg-gray-50">
        <code class="flex-1 text-[14px] font-mono text-gray-800">
          {{ projectIdCode }}
        </code>
        <CopyButton
          :text="projectIdCode"
          variant="outline"
          size="sm"
        />
      </div>
    </div>
    <template #footer>
      <Button
        size="lg"
        variant="outline"
        @click="emit('close')"
      >
        {{ t('runs.connect.modal.autoProvision.close') }}
      </Button>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import CopyButton from '../CopyButton.vue'
import OpenFileInIDE from '../OpenFileInIDE.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const props = defineProps<{
  projectId: string
  configFilePath: string
}>()

const projectIdCode = computed(() => `projectId: '${props.projectId}',`)
</script>
