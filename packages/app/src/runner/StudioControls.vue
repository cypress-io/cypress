<template>
  <div v-if="!studioStore.url && studioStore.isActive">
    <b>Please enter a valid URL to visit.</b>
  </div>

  <button
    v-if="studioStore.url && studioStore.isActive"
    @click="visitUrl"
  >
    Go ➜
  </button>

  <div class="border-y flex border-gray-50 mt-5 w-full justify-between">
    <div class="flex">
      <div class="border-r flex border-gray-50 py-2 pr-3 pl-1 items-center">
        <svg
          height="30"
          width="30"
          class="animate-pulse"
        >
          <circle
            cx="15"
            cy="15"
            r="7"
            fill="#e94f5f"
          />
        </svg>
        <span class="font-semibold">{{ t('runner.studio.studio').toUpperCase() }}</span>
        <span class="ml-1 text-gray-600"> {{ t('versions.beta').toUpperCase() }}</span>
      </div>

      <button
        class="border-r font-semibold border-gray-50 px-3 text-indigo-500 hocus-link"
        :disabled="studioStore.isLoading"
        @click="studioStore.openInstructionModal"
      >
        {{ t('runner.studio.availableCommands').toUpperCase() }}
      </button>

      <div class="flex items-center">
        <a
          class="font-semibold py-4 px-3 text-indigo-500 hocus-link"
          href="https://on.cypress.io/studio-beta"
          target="_blank"
        >{{ t('runner.studio.giveFeedback').toUpperCase() }}</a>
      </div>
    </div>

    <div class="flex">
      <Tooltip
        placement="top"
      >
        <button
          :class="`border-l ${controlsClassName}`"
          :disabled="studioStore.isLoading"
          @click="handleClose"
        >
          <i-cy-delete_x16 />
        </button>
        <template #popper>
          {{ t('runner.studio.closeStudio') }}
        </template>
      </Tooltip>

      <Tooltip
        placement="top"
      >
        <button
          :class="controlsClassName"
          :disabled="studioStore.isLoading"
          @click="handleRestart"
        >
          <i-cy-action-restart_x16 />
        </button>
        <template #popper>
          {{ t('runner.studio.restartStudio') }}
        </template>
      </Tooltip>

      <Tooltip
        placement="top"
      >
        <button
          :class="controlsClassName"
          :disabled="studioStore.isLoading || studioStore.isEmpty"
          @click="handleCopyCommands"
          @mouseleave="() => commandsCopied = false"
        >
          <span v-if="commandsCopied"><i-cy-checkmark_x16 /></span>
          <span v-else> <i-cy-general-clipboard_x16 /></span>
        </button>
        <template #popper>
          {{ t(commandsCopied ? 'runner.studio.commandsCopied' : 'runner.studio.copyCommands') }}
        </template>
      </Tooltip>

      <button
        :class="controlsClassName"
        :disabled="studioStore.isLoading || studioStore.isEmpty"
        @click="handleSaveCommands"
      >
        Save Commands
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@cy/i18n'
import { getEventManager } from '.'
import { useStudioStore } from '../store/studio-store'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

const controlsClassName = 'border-r border-gray-50 py-4 px-3'

const { t } = useI18n()

const studioStore = useStudioStore()

const eventManager = getEventManager()

const commandsCopied = ref(false)

function handleClose () {
  eventManager.emit('studio:cancel', undefined)
}

function handleRestart () {
  studioStore.reset()
  eventManager.emit('restart', undefined)
}

function handleCopyCommands () {
  eventManager.emit('studio:copy:to:clipboard', () => {
    commandsCopied.value = true
  })
}

function handleSaveCommands () {
  studioStore.startSave()
}

function visitUrl () {
  if (!studioStore.url) {
    throw Error('Cannot visit blank url')
  }

  studioStore.visitUrl(studioStore.url)
}
</script>
