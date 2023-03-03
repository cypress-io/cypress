<template>
  <div
    class="flex flex-col w-full items-center"
    data-cy="debug-default-empty-state"
  >
    <DebugTestLoadingContainer
      width-class="w-full"
      dot-class="icon-light-gray-200"
      :rows="loadingRows"
    >
      <template #header>
        <div class="flex justify-between">
          <div class="bg-white border rounded-md flex border-gray-100 py-4px px-8px text-14px text-gray-700 gap-8px items-center">
            <i-cy-status-failed_x12 class="h-12px w-12px" />
            <span>-</span>
            <div
              v-if="exampleTestName"
              class="border-l border-gray-100 pl-8px"
            >
              {{ exampleTestName }}
            </div>
          </div>
          <!-- TODO: Make a PR to Design System for this icon -->
          <Button
            v-if="slideshowCampaign"
            variant="outline"
            class="debug-empty-view-info-button-override"
            :prefix-icon="IconObjectTassel"
            @click="incrementStep"
          >
            Info
          </Button>
        </div>
      </template>
    </DebugTestLoadingContainer>
  </div>
</template>

<script setup lang="ts">
import DebugTestLoadingContainer from './DebugTestLoadingContainer.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import type { DebugSlideshowCampaigns } from '../utils/constants'
import { IconObjectTassel } from '@cypress-design/vue-icon'

defineProps<{
  exampleTestName?: string
  slideshowCampaign?: DebugSlideshowCampaigns
  incrementStep: () => void
}>()

const loadingRows = [
  ['w-40px', 'w-[40%]'],
  ['w-40px', 'w-[50%]'],
  ['w-40px', 'w-[65%]'],
]
</script>
