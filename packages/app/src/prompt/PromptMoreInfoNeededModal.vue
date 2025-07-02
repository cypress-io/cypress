<template>
  <Dialog
    :open="isOpen"
    class="inset-0 z-10 fixed overflow-y-auto"
    variant="bare"
    :initial-focus="container"
    @close="closeModal()"
  >
    <div class="flex min-h-screen items-center justify-center">
      <DialogOverlay class="bg-gray-800 opacity-90 fixed sm:inset-0" />
      <div ref="container" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogOverlay } from '@headlessui/vue'
import { init, loadRemote } from '@module-federation/runtime'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { CyPromptAppDefaultShape, MoreInfoNeededModalContentsShape } from './prompt-app-types'
import { usePromptStore } from '../store/prompt-store'

interface CyPromptApp { default: CyPromptAppDefaultShape }

// Mirrors the ReactDOM.Root type since incorporating those types
// messes up vue typing elsewhere
interface Root {
  render: (element: JSX.Element) => void
  unmount: () => void
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

withDefaults(defineProps<{
  isOpen: boolean
}>(), {
  isOpen: false,
})

const closeModal = () => {
  emit('close')
}

const container = ref<HTMLDivElement | null>(null)
const error = ref<string | null>(null)
const ReactMoreInfoNeededModalContents = ref<MoreInfoNeededModalContentsShape | null>(null)
const reactRoot = ref<Root | null>(null)
const promptStore = usePromptStore()

const maybeRenderReactComponent = () => {
  if (!ReactMoreInfoNeededModalContents.value || !!error.value) {
    return
  }

  const panel = window.UnifiedRunner.React.createElement(ReactMoreInfoNeededModalContents.value, {
    Cypress,
    testId: promptStore.currentMoreInfoNeededModalInfo?.testId,
    logId: promptStore.currentMoreInfoNeededModalInfo?.logId,
    eventManager: window.getEventManager(),
    onClose: () => {
      promptStore.currentMoreInfoNeededModalInfo?.onCancel()
      closeModal()
    },
  })

  if (!reactRoot.value) {
    reactRoot.value = window.UnifiedRunner.ReactDOM.createRoot(container.value)
  }

  reactRoot.value?.render(panel)
}

const unmountReactComponent = () => {
  if (!ReactMoreInfoNeededModalContents.value || !container.value) {
    return
  }

  reactRoot.value?.unmount()
}

onMounted(maybeRenderReactComponent)
onBeforeUnmount(unmountReactComponent)

init({
  remotes: [{
    alias: 'cy-prompt',
    type: 'module',
    name: 'cy-prompt',
    entryGlobalName: 'cy-prompt',
    entry: '/__cypress-cy-prompt/app/cy-prompt.js',
    shareScope: 'default',
  }],
  name: 'app',
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
})

// We are not using any kind of loading state, because when we get
// to this point, prompt should have already executed, which
// means that the bundle has been downloaded
loadRemote<CyPromptApp>('cy-prompt').then((module) => {
  if (!module?.default) {
    error.value = 'The panel was not loaded successfully'

    return
  }

  ReactMoreInfoNeededModalContents.value = module.default.MoreInfoNeededModalContents
  maybeRenderReactComponent()
}).catch((e) => {
  error.value = e.message
})

</script>
