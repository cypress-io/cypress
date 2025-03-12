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

const props = defineProps<{
  canAccessStudioLLM: boolean
}>()

interface StudioApp { default: StudioAppDefaultShape }

const root = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)
const Panel = ref<StudioPanelShape | null>(null)
const reactRoot = ref<any | null>(null)

const maybeRenderReactComponent = () => {
  if (!Panel.value || !!error.value) {
    return
  }

  const panel = window.UnifiedRunner.React.createElement(Panel.value, { canAccessStudioLLM: props.canAccessStudioLLM })

  reactRoot.value = window.UnifiedRunner.ReactDOM.createRoot(root.value)
  reactRoot.value?.render(panel)
}

watch(() => props.canAccessStudioLLM, maybeRenderReactComponent)

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
