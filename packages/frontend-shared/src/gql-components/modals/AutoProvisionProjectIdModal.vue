<template>
  <StandardModal
    model-value
    title="Add your project ID to finish setup"
    help-link="https://on.cypress.io/what-is-a-project-id"
    @update:model-value="emit('close')"
  >
    <div class="w-[640px]">
      <p class="mt-[8px] mb-[16px] text-[16px] leading-[24px] text-gray-700">
        We couldn't update your config file automatically. Copy the project ID below and paste it into your configuration file.
        <OpenFileInIDE :file-path="props.configFilePath">
          <template #default="{ onClick }">
            <button
              class="text-indigo-500 underline hover:text-indigo-600 ml-[4px]"
              @click="onClick"
            >
              Open config file in your IDE
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
        Close
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
const emit = defineEmits<{
  (event: 'close'): void
}>()

const props = defineProps<{
  projectId: string
  configFilePath: string
}>()

const projectIdCode = computed(() => `projectId: '${props.projectId}',`)
</script>
