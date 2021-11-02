<template>
  <SnapshotButtonGroup data-cy="snapshot-highlight-controls">
    <button
      data-cy="unpin-snapshot"
      class="border-r-1"
      @click="unpin"
    >
      <i className="fas fa-times" />
    </button>
    <button
      data-cy="toggle-snapshot-highlights"
      :title="`${snapshotStore.snapshot?.showingHighlights ? 'Hide' : 'Show'} highlights`"
      @click="toggleHighlights"
    >
      <i className="far fa-object-group" />
    </button>
  </SnapshotButtonGroup>
</template>

<script lang="ts" setup>
import type { AutIframe } from '../runner/aut-iframe'
import type { EventManager } from '../runner/event-manager'
import { useSnapshotStore } from './snapshot-store'
import SnapshotButtonGroup from './SnapshotButtonGroup.vue'

const props = defineProps<{
  eventManager: EventManager
  getAutIframe: () => AutIframe
}>()

const snapshotStore = useSnapshotStore()

const unpin = () => {
  props.eventManager.snapshotUnpinned()
}

const toggleHighlights = () => {
  snapshotStore.toggleHighlights(props.getAutIframe())
}
</script>

<style scoped lang="scss">
button {
  @apply w-12 hover:bg-gray-50;
}
</style>
