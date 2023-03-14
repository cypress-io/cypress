<template>
  <div>Run Number {{ props.runNumber }}</div>
  <pre>{{ ' | ' }}</pre>
  <div>{{ data?.completedSpecs }} out of {{ data?.totalSpecs }}</div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import { useSubscription } from '../graphql'
import { DebugProgress_SpecsDocument } from '../generated/graphql'
import { watch, watchEffect, computed, ref } from 'vue'

const props = defineProps<{
  runNumber: number
}>()

gql`
subscription DebugProgress_Specs($runNumber: Int!) {
  relevantRunSpecChange {
    currentProject {
      id
      relevantRunSpecs (runNumber: $runNumber) {
        current {
          ...DebugPendingRunCounts
          scheduledToCompleteAt
          status
        }
      }
    }
  }
}
`

const shouldPause = ref(false)

const specs = useSubscription({
  query: DebugProgress_SpecsDocument,
  variables: {
    runNumber: props.runNumber,
  },
  pause: shouldPause,
})

const data = computed(() => specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current)

watch(specs.data, (val) => {
  /* eslint-disable no-console */
  console.log(`Subscribed for ${props.runNumber} -> got data`, val)
})

// We pause the subscription if status is anything but RUNNING
watchEffect(() => {
  const status = specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current?.status

  if (status && status !== 'RUNNING') {
    shouldPause.value = true
  }
})
</script>
