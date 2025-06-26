<template>
  <div
    v-if="props.studioStatus === 'INITIALIZING'"
    ref="container"
  >
    <LoadingStudioPanel :event-manager="props.eventManager" />
  </div>
  <!-- these are two distinct errors: -->
  <!--   * if studio status is IN_ERROR, it means that the studio bundle failed to load from the cloud -->
  <!--   * if there is an error in the component state, it means module federation failed to load the component -->
  <div v-else-if="props.studioStatus === 'IN_ERROR' || error">
    <StudioErrorPanel 
      :event-manager="props.eventManager" 
      :on-retry="handleRetry"
    />
  </div>
  <div
    v-else
    ref="container"
  >
    <LoadingStudioPanel
      v-if="!ReactStudioPanel"
      :event-manager="props.eventManager"
    />
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { init, loadRemote } from '@module-federation/runtime'
import type { StudioAppDefaultShape, StudioPanelShape } from './studio-app-types'
import LoadingStudioPanel from './LoadingStudioPanel.vue'
import StudioErrorPanel from './StudioErrorPanel.vue'
import type { EventManager } from '../runner/event-manager'

// Mirrors the ReactDOM.Root type since incorporating those types
// messes up vue typing elsewhere
interface Root {
  render: (element: JSX.Element) => void
  unmount: () => void
}

const props = defineProps<{
  canAccessStudioAI: boolean
  onStudioPanelClose: () => void
  eventManager: EventManager
  studioStatus: string | null
  cloudStudioSessionId?: string
}>()

interface StudioApp { default: StudioAppDefaultShape }

const container = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)
const ReactStudioPanel = ref<StudioPanelShape | null>(null)
const reactRoot = ref<Root | null>(null)

watch(() => error.value, (newError) => {
  console.log('error', newError)
})

const maybeRenderReactComponent = () => {
  // Skip rendering if studio is initializing or errored out
  if (props.studioStatus === 'INITIALIZING' || props.studioStatus === 'IN_ERROR') {
    return
  }

  if (!ReactStudioPanel.value || !!error.value) {
    return
  }

  const panel = window.UnifiedRunner.React.createElement(ReactStudioPanel.value, {
    canAccessStudioAI: props.canAccessStudioAI,
    onStudioPanelClose: props.onStudioPanelClose,
    studioSessionId: props.cloudStudioSessionId,
  })

  if (!reactRoot.value) {
    reactRoot.value = window.UnifiedRunner.ReactDOM.createRoot(container.value)
  }

  reactRoot.value?.render(panel)
}

watch(() => props.canAccessStudioAI, maybeRenderReactComponent)
watch(() => props.cloudStudioSessionId, maybeRenderReactComponent)

const unmountReactComponent = () => {
  if (!ReactStudioPanel.value || !container.value) {
    return
  }

  reactRoot.value?.unmount()
}

init({
  remotes: [{
    alias: 'app-studio',
    type: 'module',
    name: 'app-studio',
    entryGlobalName: 'app-studio',
    entry: '/__cypress-studio/app-studio.js',
    shareScope: 'default',
  }],
  shared: {
    react: {
      scope: 'default',
      version: '18.3.1',
      lib: () => window.UnifiedRunner.React,
      shareConfig: {
        singleton: true,
        requiredVersion: '^18.3.1',
      },
    },
  },
  name: 'app',
})

onMounted(maybeRenderReactComponent)
onBeforeUnmount(unmountReactComponent)

watch(() => props.studioStatus, (newStatus) => {
  console.log('props.studioStatus', newStatus)
  if (newStatus === 'ENABLED') {
    loadStudioComponent()
  }
}, { immediate: true })

function loadStudioComponent () {
  if (ReactStudioPanel.value) {
    return
  }

  loadRemote<StudioApp>('app-studio').then((module) => {
    if (!module?.default) {
      error.value = 'The panel was not loaded successfully'

      return
    }

    ReactStudioPanel.value = module.default.StudioPanel
    maybeRenderReactComponent()
  }).catch((e) => {
    error.value = e.message
  })
}

function handleRetry () {
  // Clear any existing error
  error.value = null
  
  // Reset the React panel component so it can be reloaded
  ReactStudioPanel.value = null
  
  // If status was IN_ERROR, we need to emit a studio init event to retry
  if (props.studioStatus === 'IN_ERROR') {
    props.eventManager.emit('studio:init:suite', { suiteId: 'r1', showUrlPrompt: false })
  } else {
    // Otherwise, try to reload the studio component
    loadStudioComponent()
  }
}

</script>
