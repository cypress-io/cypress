<template>
  <div
    id="main-grid"
    class="grid p-12 gap-8 h-full"
  >
    <div>
      <InlineSpecList
        :gql="props.gql"
        @selectSpec="selectSpec"
      />
    </div>

    <div
      id="runner"
      :style="`width: ${runnerColumnWidth}px`"
    >
      <div
        :id="RUNNER_ID"
        class="viewport origin-left"
        :style="viewportStyle"
      />
      <div>Viewport: {{ viewportDimensions.width }}px x {{ viewportDimensions.height }}px</div>
    </div>

    <div
      v-once
      :id="REPORTER_ID"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { useMutation } from '@urql/vue'
import { UnifiedRunnerAPI } from '../runner'
import { REPORTER_ID, RUNNER_ID, getRunnerElement, getReporterElement, empty } from '../runner/utils'
import { gql } from '@urql/core'
import { Runner_SetCurrentSpecDocument, Specs_RunnerFragment } from '../generated/graphql'
import InlineSpecList from '../specs/InlineSpecList.vue'
import { getStore } from '../store'

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
  setCurrentSpec(id: $id)
}
`

const runnerColumnWidth = 400

const store = getStore()

const viewportDimensions = reactive({
  height: store.height,
  width: store.width,
})

window.UnifiedRunner.MobX.reaction(
  () => [store.height, store.width],
  ([height, width]) => {
    viewportDimensions.height = height
    viewportDimensions.width = width
  },
)

const viewportStyle = computed(() => {
  return `
  width: ${viewportDimensions.width}px;
  height: ${viewportDimensions.height}px;
  transform: scale(${runnerColumnWidth / viewportDimensions.width})
`
})

const setSpecMutation = useMutation(Runner_SetCurrentSpecDocument)

const props = defineProps<{
  gql: Specs_RunnerFragment
}>()

async function selectSpec (id: string) {
  const specToRun = await setSpecMutation.executeMutation({ id })

  if (!specToRun.data?.setCurrentSpec.currentSpec) {
    return
  }

  UnifiedRunnerAPI.executeSpec(specToRun.data?.setCurrentSpec.currentSpec)
}

function executeSpec () {
  if (!props.gql?.activeProject?.currentSpec) {
    return
  }

  UnifiedRunnerAPI.executeSpec(props.gql.activeProject.currentSpec)
}

onMounted(() => {
  window.UnifiedRunner.eventManager.on('restart', () => {
    executeSpec()
  })

  executeSpec()
})

onBeforeUnmount(() => {
  // For now we clean up the AUT and Reporter every time we leave the route.
  // In the long term, we really should use <keep-alive> and maintain the state
  // For now, this is much more simple.
  empty(getRunnerElement())
  window.UnifiedRunner.shortcuts.stop()
  empty(getReporterElement())
})

</script>

<style scoped>
#main-grid {
  grid-template-columns: 1fr 2fr 2fr;
}

.viewport {
  border: 2px dotted blue;
}

#runner {
  border: 1px solid black;
}

#unified-runner {
  position: relative;
}

#unified-reporter {
  position: relative;
  width: 300px;
  height: 100%;
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
