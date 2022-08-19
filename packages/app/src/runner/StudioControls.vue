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

  <div>
    <b>Studio Beta</b>
  </div>

  <button
    :disabled="studioStore.isLoading"
    @click="handleShowCommands"
  >
    Available Commands
  </button>

  <a
    href="https://on.cypress.io/studio-beta"
    target="_blank"
  >Give feedback</a>

  <div>
    <!-- these are the buttons that do the things -->
    <button
      :disabled="studioStore.isLoading"
      @click="handleClose"
    >
      Close Studio
    </button>

    <button
      :disabled="studioStore.isLoading"
      @click="handleRestart"
    >
      Restart
    </button>

    <button
      :disabled="studioStore.isLoading || studioStore.isEmpty"
      @click="handleCopyCommands"
    >
      Copy Commands
    </button>

    <button
      :disabled="studioStore.isLoading || studioStore.isEmpty"
      @click="handleSaveCommands"
    >
      Save Commands
    </button>
  </div>
</template>

<script setup lang="ts">
import { getEventManager } from '.'
import { useStudioStore } from '../store/studio-store'

const studioStore = useStudioStore()

function handleShowCommands () {
  // TODO: Show modal with available commands'
}

const eventManager = getEventManager()

function handleClose () {
  eventManager.emit('studio:cancel', undefined)
}

function handleRestart () {
  studioStore.reset()
  eventManager.emit('restart', undefined)
}

function handleCopyCommands () {
  eventManager.emit('studio:copy:to:clipboard', () => {
    // optional callback - do we need this?
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
