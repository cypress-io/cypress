<template>
  <div>Run Number {{ props.runNumber }}</div>
  <pre>{{ ' | ' }}</pre>
  <div>{{ data?.completedSpecs }} out of {{ data?.totalSpecs }}</div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import { useSubscription } from '../graphql'
import { DebugProgress_SpecsDocument } from '../generated/graphql'
import { watch, computed } from 'vue'

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
        }
      }
    }
  }
}
`

const specs = useSubscription({
  query: DebugProgress_SpecsDocument,
  variables: {
    runNumber: props.runNumber,
  },
})

const data = computed(() => specs.data.value?.relevantRunSpecChange?.currentProject?.relevantRunSpecs?.current)

watch(specs.data, (val) => {
  /* eslint-disable no-console */
  console.log(`Subscribed for ${props.runNumber} -> got data`, val)
})
</script>
