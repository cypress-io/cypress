<template>
  <div class="inset-x-0 bottom-24 absolute">
    <div class="flex justify-center children:h-11">
      <SnapshotMessage
        v-if="snapshotStore.messageTitle"
        :message-title="snapshotStore.messageTitle"
        :message-description="snapshotStore.messageDescription"
        :message-type="snapshotStore.messageType"
      />

      <SnapshotHighlightControls
        v-if="snapshotStore.isSnapshotPinned && snapshotStore.snapshotProps?.$el"
        :event-manager="props.eventManager"
        :get-aut-iframe="props.getAutIframe"
      />

      <SnapshotChangeState
        v-if="snapshotStore.isSnapshotPinned && shouldShowStateControls"
        :get-aut-iframe="props.getAutIframe"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useSnapshotStore } from './snapshot-store'
import SnapshotMessage from './SnapshotMessage.vue'
import SnapshotChangeState from './SnapshotChangeState.vue'
import SnapshotHighlightControls from './SnapshotHighlightControls.vue'
import type { EventManager } from '../runner/event-manager'
import type { AutIframe } from '../runner/aut-iframe'

const props = defineProps<{
  eventManager: EventManager
  getAutIframe: () => AutIframe
}>()

const snapshotStore = useSnapshotStore()

const shouldShowStateControls = computed(() => {
  // only show these controls if there is at least 2 different snapshots to compare.
  // usually an interaction, such a button was clicked, and we want to show
  // how the UI looked before and after the button click.
  const snapshots = snapshotStore.snapshotProps?.snapshots

  return snapshots && snapshots.length >= 2
})
</script>
