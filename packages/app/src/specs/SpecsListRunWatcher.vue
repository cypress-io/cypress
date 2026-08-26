<!--
  Non-rendering component: watches running runs and emits when a run changes.
  Used by the specs list to refresh spec data while a run is RUNNING.
-->
<template>
  <span
    class="hidden"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { gql, useSubscription } from '@urql/vue'
import { computed } from 'vue'
import type { CloudRunStatus } from '../generated/graphql'
import { SpecsListRunWatcherDocument } from '../generated/graphql'

/**
 * Subscription to watch a run.
 * Values being queried are there to tell the polling source
 * which fields to watch for changes
 */
gql`
subscription SpecsListRunWatcher($id: ID!) {
  relevantRunSpecChange(runId: $id) {
    id
    status
    totalInstanceCount
    completedInstanceCount
  }
}
`

const props = defineProps<{
  run: {runId: string, status: CloudRunStatus | null }
}>()

const emits = defineEmits<{
  (eventName: 'runUpdate'): void
}>()

const variables = computed(() => {
  return { id: props.run.runId }
})

const shouldPause = computed(() => {
  return props.run.status !== 'RUNNING'
})

const handleUpdate = () => {
  emits('runUpdate')
}

useSubscription({ query: SpecsListRunWatcherDocument, variables, pause: shouldPause }, handleUpdate)

</script>
