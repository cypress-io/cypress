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
import { onMounted } from 'vue'
import { UnifiedRunnerAPI } from '../runner'
import { REPORTER_ID, RUNNER_ID } from '../runner/utils'
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
