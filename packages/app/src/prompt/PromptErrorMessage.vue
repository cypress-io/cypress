<template>
  <div class="max-h-[700px] w-[912px] overflow-auto bg-gray-1000 rounded mx-auto ring-[#9095AD40] ring-4 relative">
    <div class="px-[24px] py-[12px] flex items-center justify-between border-b border-gray-900">
      <div class="flex items-center gap-2">
        <span class="text-white text-sm">cy.prompt</span>
        <div class="w-[32px] h-[1px] bg-gray-900" />
        <span class="text-gray-300 text-sm">Get code</span>
      </div>
      <IconActionDeleteLarge
        stroke-color="gray-400"
        class="cursor-pointer"
        data-cy="close-modal-button"
        @click="onClose"
      />
    </div>
    <div
      class="flex flex-col items-center justify-center h-[272px] p-[24px] gap-[24px]"
      data-cy="error-message"
    >
      <IconTechnologyDashboardFail
        size="48"
        stroke-color="gray-500"
        fill-color="gray-900"
      />
      <div class="flex flex-col gap-[4px] text-center">
        <span class="text-white">Something went wrong</span>
        <span class="text-gray-200 text-sm">
          There was a problem with loading the prompt code. Our team has been
          notified. If the problem persists, please try again later.
        </span>
      </div>
    </div>

    <div class="px-[24px] py-[12px] mt-[12px] border-t border-gray-900 bg-gray-950">
      <Button
        data-cy="close-modal-button"
        @click="onClose"
      >
        Close
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconActionDeleteLarge,
  IconTechnologyDashboardFail,
} from '@cypress-design/vue-icon'
import Button from '@cypress-design/vue-button'

defineProps<{
  onClose: () => void
}>()
</script>
