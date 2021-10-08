<template>
  <div>
    <h2>Runner Page</h2>
    <div v-once>
      <div :id="RUNNER_ID" />
      <div :id="REPORTER_ID" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { UnifiedRunnerAPI } from '../runner'
import { REPORTER_ID, RUNNER_ID, getRunnerElement, getReporterElement, empty } from '../runner/utils'
import { gql } from '@urql/core'
import type { CurrentSpec_RunnerFragment } from '../generated/graphql'

gql`
fragment CurrentSpec_Runner on BaseSpec {
  id
  name
  relative
  absolute 
}
`

const props = defineProps<{
  gql: CurrentSpec_RunnerFragment | null
}>()

onMounted(() => {
  UnifiedRunnerAPI.initialize(execute)
})

onBeforeUnmount(() => {
  // For now we clean up the AUT and Reporter every time we leave the route.
  // In the long term, we really should use <keep-alive> and maintain the state
  // For now, this is much more simple.
  empty(getRunnerElement())
  window.UnifiedRunner.shortcuts.stop()
  empty(getReporterElement())
})

const execute = () => {
  if (!props.gql) {
    return
  }

  UnifiedRunnerAPI.executeSpec(props.gql)
}
</script>

<route>
{
  name: "Runner"
}
</route>
