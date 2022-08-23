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

    <input
      v-if="studioStore.saveModalIsOpen"
      v-model="testName"
      style="border: 1px solid black"
    >
    <button
      :disabled="!testName"
      @click="handleSave"
    >
      Save Test
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getEventManager } from '.'
import { useStudioStore } from '../store/studio-store'

const studioStore = useStudioStore()

function handleShowCommands () {
  // TODO: Show modal with available commands'
}

function handleSave () {
  studioStore.save(testName.value)
}

const eventManager = getEventManager()

const testName = ref('')

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
