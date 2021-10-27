<template>
  <SnapshotButtonGroup data-cy="snapshot-change-state">
    <button
      v-for="snapshot in snapshots"
      :key="snapshot.index"
      class="border-l-1 first:border-l-0"
      @click="changeState(snapshot.index)"
    >
      {{ snapshot.name || snapshot.index + 1 }}
    </button>
  </SnapshotButtonGroup>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useSnapshotStore } from './snapshot-store'
import SnapshotButtonGroup from './SnapshotButtonGroup.vue'

const snapshotStore = useSnapshotStore()

const changeState = (index: number) => {
  snapshotStore.changeState(index)
}

const snapshots = computed(() => {
  return (snapshotStore.snapshotProps?.snapshots || [])
  .map((x, index) => ({ ...x, index }))
})
</script>

<style scoped lang="scss">
button {
  @apply w-12 hover:bg-gray-50;
}
</style>
