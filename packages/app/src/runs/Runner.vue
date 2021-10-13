<template>
  <div class="grid grid-cols-3 p-12 gap-8">
    <InlineSpecList
      :gql="props.gql"
      @selectSpec="selectSpec"
    />
    <div
      v-once
      :id="RUNNER_ID"
    />
    <div
      v-once
      :id="REPORTER_ID"
    />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useMutation } from '@urql/vue'
import { UnifiedRunnerAPI } from '../runner'
import { REPORTER_ID, RUNNER_ID, getRunnerElement, getReporterElement, empty } from '../runner/utils'
import { gql } from '@urql/core'
import { Runner_SetCurrentSpecDocument, Specs_RunnerFragment } from '../generated/graphql'
import InlineSpecList from '../specs/InlineSpecList.vue'
import type { BaseSpec } from '@packages/types/src'

gql`
fragment CurrentSpec_Runner on Spec {
  id
  relative
  absolute
  name
}
`

gql`
fragment Specs_Runner on App {
  ...Specs_InlineSpecList
  activeProject {
    id
    projectRoot
    currentSpec {
      ...CurrentSpec_Runner
    }
  }
}
`

gql`
mutation Runner_SetCurrentSpec($id: ID!) {
  setCurrentSpec(id: $id) {
    currentSpec {
      id
      relative
      absolute
      name
    }
  }
}
`

const setSpecMutation = useMutation(Runner_SetCurrentSpecDocument)

const props = defineProps<{
  gql: Specs_RunnerFragment
}>()

async function selectSpec (id: string) {
  const specToRun = await setSpecMutation.executeMutation({ id })

  if (!specToRun.data?.setCurrentSpec.currentSpec) {
    return
  }

  execute(specToRun.data.setCurrentSpec.currentSpec)
}

function executeSpec () {
  if (!props.gql?.activeProject?.currentSpec) {
    return
  }

  execute(props.gql.activeProject.currentSpec)
}

onMounted(() => {
  UnifiedRunnerAPI.initialize(() => {
    window.UnifiedRunner.eventManager.on('restart', () => {
      executeSpec()
    })

    executeSpec()
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

const execute = (spec: BaseSpec) => {
  UnifiedRunnerAPI.executeSpec(spec)
}
</script>

<style scoped>
#unified-runner {
  position: relative;
  /* flex-grow: 1; */
  /* box-shadow: 0px 0px 5px 0 black; */
  /* padding: 10px; */
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
