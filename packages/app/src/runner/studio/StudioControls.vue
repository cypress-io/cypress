<template>
  <div class="border-y flex border-gray-50 w-full justify-between">
    <div class="flex">
      <div class="flex pr-5 pl-5 items-center">
        <span
          v-if="studioStore.url && studioStore.isActive && !studioStore.isFailed"
          class="mr-2"
        ><i-cy-action-record_x16 class="animate-pulse icon-dark-red-500 icon-light-red-500" /></span>
        <span
          v-else
          class="px-2"
        ><i-cy-object-magic-wand-dark-mode_x16 class="fill-purple-300 stroke-purple-300" /></span>
        <div class="font-semibold text-base text-gray-800">
          <span>{{ t('runner.studio.studio').toUpperCase() }}</span>
          <span class="ml-1"> {{ t('versions.beta').toUpperCase() }}</span>
        </div>
      </div>

      <div class="flex items-center">
        <a
          class="cursor-pointer font-medium text-base text-indigo-500 hocus-link hover:underline"
          @click="studioStore.openInstructionModal"
        >
          {{ t('runner.studio.availableCommands') }}
        </a>
      </div>
    </div>

    <div class="flex">
      <div class="border rounded-md flex border-gray-100 m-1">
        <Tooltip
          placement="top"
        >
          <button
            :class="`border-r ${controlsClassName}`"
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
            :class="`border-r ${controlsClassName}`"
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
            <span
              v-if="commandsCopied"
            ><i-cy-checkmark_x16 class="icon-dark-green-400 icon-light-green-400" /></span>
            <span v-else> <i-cy-general-clipboard_x16 /></span>
          </button>
          <template #popper>
            {{ t(commandsCopied ? 'runner.studio.commandsCopied' : 'runner.studio.copyCommands') }}
          </template>
        </Tooltip>
      </div>

      <div class="flex items-center">
        <button
          class="rounded-md bg-indigo-500 mx-3 text-white py-2 px-3 hover:bg-indigo-400 disabled:opacity-50 disabled:pointer-events-none"
          :disabled="studioStore.isLoading || studioStore.isEmpty || studioStore.isFailed"
          @click="handleSaveCommands"
        >
          {{ t('runner.studio.saveTestButton') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@cy/i18n'
import { getEventManager } from '../'
import { useStudioStore } from '../../store/studio-store'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

const controlsClassName = 'border-gray-100 py-2 px-3 disabled:stroke-gray-400 disabled:pointer-events-none disabled:opacity-50'

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
</script>
