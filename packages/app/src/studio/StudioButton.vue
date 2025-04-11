<template>
  <div className="flex items-center">
    <button
      className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-700 rounded text-gray-500 hover:bg-gray-800"
      @click="toggleStudioPanel"
    >
      <IconMenuExpandRight
        size="16"
        stroke-color="gray-500"
      />
      <span className="text-sm">Studio</span>
      <Tag
        color="purple"
        :dark="true"
        size="16"
      >
        Beta
      </Tag>
    </button>
  </div>
</template>

<script setup>
import { IconMenuExpandRight } from '@cypress-design/vue-icon'
import Tag from '@cypress-design/vue-tag'
import { useStudioStore } from '../store/studio-store'
import { getEventManager } from '../runner'

const studioStore = useStudioStore()

const eventManager = getEventManager()

function toggleStudioPanel () {
  if (studioStore.isActive) {
    eventManager.emit('studio:cancel')
  } else {
    // TODO mabel handle not opening the studio url prompt
    eventManager.emit('studio:init:suite', 'r1')
  }
}
</script>
