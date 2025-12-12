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
      :title="errorPanelProps.title"
      :message="errorPanelProps.message"
      :icon="errorPanelProps.icon"
      :learn-more-url="errorPanelProps.learnMoreUrl"
      :on-retry="errorPanelProps.onRetry"
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
import { ref, onMounted, onBeforeUnmount, watch, computed, h } from 'vue'
import { init, loadRemote, registerRemotes } from '@module-federation/runtime'
import type { StudioAppDefaultShape, StudioPanelShape } from './studio-app-types'
import type { UserProjectStatusStore } from '@cy/store/user-project-status-store'
import LoadingStudioPanel from './LoadingStudioPanel.vue'
import StudioErrorPanel from './StudioErrorPanel.vue'
import type { EventManager } from '../runner/event-manager'
import { useMutation, gql, UseMutationResponse } from '@urql/vue'
import { IconCypressStudio } from '@cypress-design/vue-icon'
import type { SpecDirtyDataStore } from '../store/spec-dirty-data-store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import { getAutIframeModel } from '../runner'
import { closePlayground } from '../runner/selector-playground/utils'

// Mirrors the ReactDOM.Root type since incorporating those types
// messes up vue typing elsewhere
interface Root {
  render: (element: JSX.Element) => void
  unmount: () => void
}

const retryStudioMutationGql = gql`
  mutation RetryStudio {
    retryStudio
  }
`

const props = defineProps<{
  canAccessStudioAI: boolean
  onStudioPanelClose: () => void
  eventManager: EventManager
  studioStatus: string | null
  isCertError?: boolean | null
  cloudStudioSessionId?: string
  autUrlSelector: string
  userProjectStatusStore: UserProjectStatusStore
  hasRequestedProjectAccess: boolean
  requestProjectAccessMutation: UseMutationResponse<any, any>
  specDirtyDataStore: SpecDirtyDataStore
}>()

interface StudioApp { default: StudioAppDefaultShape }

const container = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)
const ReactStudioPanel = ref<StudioPanelShape | null>(null)
const containerReactRootMap = new WeakMap<HTMLElement, Root>()

const retryStudioMutation = useMutation(retryStudioMutationGql)

const selectorPlaygroundStore = useSelectorPlaygroundStore()

const isSelectorPlaygroundOpen = computed(() => {
  return selectorPlaygroundStore.show
})

// Callback to close Selector Playground when Studio recording starts
const onCloseSelectorPlayground = () => {
  try {
    const autIframe = getAutIframeModel()

    if (autIframe) {
      closePlayground(autIframe)
    }
  } catch {
    // If the AUT iframe isn't initialized yet, skip the operation silently
  }
}

const errorPanelProps = computed(() => {
  if (props.isCertError) {
    return {
      title: 'Configure your proxy to use Cypress Studio',
      message: 'Cypress Studio requires an internet connection. To continue, you may need to configure Cypress with your proxy settings.',
      icon: () => {
        return h(IconCypressStudio, {
          size: '48',
          'fill-color': 'gray-500',
        })
      },
      learnMoreUrl: 'https://on.cypress.io/proxy-configuration',
      onRetry: handleRetry,
    }
  }

  return {
    onRetry: handleRetry,
  }
})

const maybeRenderReactComponent = () => {
  // Skip rendering if studio is initializing or errored out
  if (props.studioStatus === 'INITIALIZING' || props.studioStatus === 'IN_ERROR') {
    return
  }

  if (!ReactStudioPanel.value || !!error.value || !container.value) {
    return
  }

  const panel = window.UnifiedRunner.React.createElement(ReactStudioPanel.value, {
    canAccessStudioAI: props.canAccessStudioAI,
    onStudioPanelClose: props.onStudioPanelClose,
    studioSessionId: props.cloudStudioSessionId,
    autUrlSelector: props.autUrlSelector,
    userProjectStatusStore: props.userProjectStatusStore,
    hasRequestedProjectAccess: props.hasRequestedProjectAccess,
    requestProjectAccessMutation: props.requestProjectAccessMutation,
    specDirtyDataStore: props.specDirtyDataStore,
    isSelectorPlaygroundOpen: isSelectorPlaygroundOpen.value,
    onCloseSelectorPlayground,
  })

  // Store the react root in a weak map keyed by the container. We do this so that we have a reference
  // to it that's tied to the container value but absolutely do not want to use vue to do the tracking.
  // If vue tracks it (e.g. using a ref) it creates proxies that do not play nicely with React in
  // production
  let reactRoot = containerReactRootMap.get(container.value)

  if (!reactRoot) {
    reactRoot = window.UnifiedRunner.ReactDOM.createRoot(container.value) as Root
    containerReactRootMap.set(container.value, reactRoot)
  }

  reactRoot?.render(panel)
}

watch(() => props.canAccessStudioAI, maybeRenderReactComponent)
watch(() => props.cloudStudioSessionId, maybeRenderReactComponent)
watch(() => isSelectorPlaygroundOpen.value, maybeRenderReactComponent)

const unmountReactComponent = () => {
  if (!ReactStudioPanel.value || !container.value) {
    return
  }

  const reactRoot = containerReactRootMap.get(container.value)

  if (!reactRoot) {
    return
  }

  reactRoot.unmount()
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
  error.value = null
  ReactStudioPanel.value = null

  // If status was IN_ERROR, we need to retry the studio initialization
  if (props.studioStatus === 'IN_ERROR') {
    retryStudioMutation.executeMutation({})
  } else {
    // Otherwise, try to reload the studio component with a cache-busting parameter
    registerRemotes([{
      alias: 'app-studio',
      type: 'module',
      name: 'app-studio',
      entryGlobalName: 'app-studio',
      entry: `/__cypress-studio/app-studio.js?retry=${Date.now()}`,
      shareScope: 'default',
    }], { force: true })

    loadStudioComponent()
  }
}

</script>
