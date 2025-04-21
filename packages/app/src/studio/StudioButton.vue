<template>
  <div className="flex items-center bg-gray-1100">
    <Button
      class="gap-[8px]"
      variant="outline-dark"
      data-cy="studio-button"
      size="32"
      @click="toggleStudioPanel"
    >
      <IconMenuExpandRight
        v-if="studioStore.isOpen"
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
      <IconMenuExpandLeft
        v-if="!studioStore.isOpen"
        size="16"
        stroke-color="gray-500"
      />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { IconMenuExpandLeft, IconMenuExpandRight } from '@cypress-design/vue-icon'
import Button from '@cypress-design/vue-button'
import Tag from '@cypress-design/vue-tag'
import { useStudioStore } from '../store/studio-store'
import type { EventManager } from '../runner/event-manager'

const props = defineProps<{ eventManager: EventManager }>()

const studioStore = useStudioStore()

function toggleStudioPanel () {
  if (studioStore.isOpen) {
    props.eventManager.emit('studio:cancel', undefined)
  } else {
    props.eventManager.emit('studio:init:suite', { suiteId: 'r1', showUrlPrompt: false })
  }
}
</script>
