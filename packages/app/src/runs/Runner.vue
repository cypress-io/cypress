<template>
  <div>
    <div v-once>
      <div class="flex">
        <div :id="RUNNER_ID" />
        <div :id="REPORTER_ID" />
      </div>
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
fragment CurrentSpec_Runner on Spec {
  id
  relative
  absolute
  name
}
`

const props = defineProps<{
  gql: CurrentSpec_RunnerFragment | null
}>()

onMounted(() => {
  UnifiedRunnerAPI.initialize(() => {
    window.UnifiedRunner.eventManager.on('restart', () => {
      execute()
    })

    execute()
  })
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

<style scoped>
#unified-runner {
  position: relative;
  flex-grow: 1;
  margin: 20px;
  box-shadow: 0px 0px 5px 0 black;
  padding: 10px;
}

#unified-reporter {
  position: relative;
  width: 300px;
  height: 100vh;
}
</style>

<route>
{
  name: "Runner"
}
</route>

<style>
#unified-runner > div {
  height: 100%;
}

iframe {
  width: 100%;
  height: 100%;
}
</style>
