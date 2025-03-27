<template>
  <div
    v-if="renderSnapshotControls"
    class="inset-x-0 bottom-24 absolute"
    data-testid="snapshot-controls"
  >
    <div class="flex justify-center">
      <div
        class="rounded flex bg-gray-1000 shadow min-h-[40px] py-[4px] px-[8px] text-gray-600 gap-[4px] items-center"
      >
        <i-cy-object-pin_x16 class="icon-dark-purple-400 icon-light-purple-800" />
        <span
          v-if="snapshotStore.messageTitle"
          class="rounded min-h-[24px] p-[4px] text-[14px] text-gray-600 capitalize block"
        >{{ snapshotStore.messageTitle }}</span>

        <SnapshotToggle
          v-if="shouldShowStateControls"
          :messages="snapshotMessages"
          :active-index="snapshotStore.snapshot?.stateIndex"
          @select="changeState"
        />

        <SnapshotHighlightControls
          v-if="shouldShowHighlightControls"
          :value="snapshotStore.snapshot?.showingHighlights"
          @toggle="toggleHighlights"
        />

        <button
          v-if="shouldShowStateControls || shouldShowHighlightControls"
          class="border-transparent rounded outline-none bg-gray-900 border my-1 mr-[2px] transition duration-150 hocus:border-purple-300 "
          style="padding: 3px"
          aria-label="unpin snapshot"
          @click="unpin"
        >
          <i-cy-delete_x16
            class="icon-dark-gray-200"
            data-testid="unpin"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useSnapshotStore } from './snapshot-store'
import SnapshotHighlightControls from './SnapshotHighlightControls.vue'
import type { EventManager } from '../runner/event-manager'
import type { AutIframe } from '../runner/aut-iframe'
import SnapshotToggle from './SnapshotToggle.vue'

const props = defineProps<{
  eventManager: EventManager
  getAutIframe: () => AutIframe
}>()

const snapshotStore = useSnapshotStore()

const snapshots = computed(() => snapshotStore.snapshotProps?.snapshots)

const snapshotMessages = computed(() => {
  if (!snapshots.value) return []

  return snapshots.value.map(({ name }, idx) => {
    if (!name) return { text: `${idx + 1}`, id: `${idx}` }

    return { text: `${name}`, id: `${idx}` }
  })
})

const shouldShowStateControls = computed(() => {
  // only show these controls if there is at least 2 different snapshots to compare.
  // usually an interaction, such a button was clicked, and we want to show
  // how the UI looked before and after the button click.
  return snapshots.value && snapshots.value.length >= 2
})

const unpin = () => {
  props.eventManager.snapshotUnpinned()
  snapshotStore.$reset()
}

const toggleHighlights = () => {
  snapshotStore.toggleHighlights(props.getAutIframe())
}

const shouldShowHighlightControls = computed(() => {
  return snapshotStore.isSnapshotPinned && snapshotStore.snapshotProps?.$el
})

const renderSnapshotControls = computed(() => {
  return shouldShowStateControls.value || shouldShowHighlightControls.value || snapshotStore.messageTitle
})

const changeState = ({ idx }) => {
  snapshotStore.changeState(idx, props.getAutIframe())
}
</script>
