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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { init, loadRemote } from '@module-federation/runtime'

const root = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)
const Panel = ref<ReturnType<any> | null>(null)

const maybeRenderReactComponent = () => {
  if (!Panel.value || !!error.value) {
    return
  }

  const panel = window.UnifiedRunner.React.createElement(Panel.value)

  window.UnifiedRunner.ReactDOM.createRoot(root.value).render(panel)
}

const unmountReactComponent = () => {
  if (!Panel.value || !root.value) {
    return
  }

  window.UnifiedRunner.ReactDOM.unmountComponentAtNode(root.value)
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

loadRemote<typeof import('app-studio')>('app-studio').then((module) => {
  if (!module?.default) {
    error.value = 'The panel was not loaded successfully'

    return
  }

  Panel.value = module.default
  maybeRenderReactComponent()
}).catch((e) => {
  error.value = e.message
})

</script>
