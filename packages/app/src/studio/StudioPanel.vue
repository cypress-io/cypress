<template>
  <div v-if="error">
    Error loading the panel
  </div>
  <div
    v-else
    ref="root"
  >
    Loading the panel...
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { init, loadRemote } from '@module-federation/runtime'
import type { StudioAppDefaultShape, StudioPanelShape } from './studio-app-types'

// Mirrors the ReactDOM.Root type since incorporating those types
// messes up vue typing elsewhere
interface Root {
  render: (element: JSX.Element) => void
  unmount: () => void
}

const props = defineProps<{
  canAccessStudioAI: boolean
}>()

interface StudioApp { default: StudioAppDefaultShape }

const root = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)
const Panel = ref<StudioPanelShape | null>(null)
const reactRoot = ref<Root | null>(null)

const maybeRenderReactComponent = () => {
  if (!Panel.value || !!error.value) {
    return
  }

  const panel = window.UnifiedRunner.React.createElement(Panel.value, { canAccessStudioAI: props.canAccessStudioAI })

  reactRoot.value = window.UnifiedRunner.ReactDOM.createRoot(root.value)
  reactRoot.value?.render(panel)
}

watch(() => props.canAccessStudioAI, maybeRenderReactComponent)

const unmountReactComponent = () => {
  if (!Panel.value || !root.value) {
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

loadRemote<StudioApp>('app-studio').then((module) => {
  if (!module?.default) {
    error.value = 'The panel was not loaded successfully'

    return
  }

  Panel.value = module.default.StudioPanel
  maybeRenderReactComponent()
}).catch((e) => {
  error.value = e.message
})

</script>
