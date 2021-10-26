<template>
  <div class="absolute inset-x-0 bottom-24">
    <div v-if="snapshotStore.isSnapshotPinned">
      <div>
        {{ snapshotStore.messageTitle }}
        ({{ snapshotStore.messageDescription }})
      </div>
      <button class="border border-3 border" @click="unpin">Unpin</button>

      <div v-if="snapshotStore.snapshotProps?.$el">
        <button @click="toggleHighlights">
          {{ `${snapshotStore.snapshot?.showingHighlights ? 'Hide' : 'Show'} highlights` }}
        </button>
      </div>

      <div v-if="snapshots.length >= 2">
        <button 
          v-for="snapshot in snapshots"
          @click="changeState(snapshot.index)"
        >
          {{ snapshot.name || snapshot.index + 1 }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue-demi'
import { useSnapshotStore } from './snapshot-store'

const props = defineProps<{
  eventManager: typeof window.UnifiedRunner.eventManager
}>()

const snapshotStore = useSnapshotStore()

const unpin = () => {
  props.eventManager.snapshotUnpinned()
}

const toggleHighlights = () => {
  snapshotStore.toggleHighlights()
}

const changeState = (index: number) => {
  snapshotStore.changeState(index)
}

const snapshots = computed(() => {
  return (snapshotStore.snapshotProps?.snapshots || [])
    .map((x, index) => ({...x, index }))
})
</script>

<style scoped>
</style>
