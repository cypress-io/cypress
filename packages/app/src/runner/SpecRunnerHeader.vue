<template>
  <div :style="{width: `${props.width}px`}">
    <div class="flex justify-between">
      <!--
        TODO: Studio. Out of scope for GA.
        <button
        data-cy="header-studio"
        :disabled="isDisabled"
      >
        Studio
      </button> -->

      <button
        data-cy="header-selector"
        :disabled="isDisabled"
        class="px-8px"
        @click="togglePlayground"
      >
        <Icon
          height="22px"
          width="22px"
          :icon="IconCrosshairsGPS"
        />
      </button>

      <div
        v-if="props.gql.currentTestingType === 'e2e'"
        data-cy="aut-url"
      >
        <div
          class="rounded-md flex shadow-md mx-2 px-4 url"
          :class="{
            'bg-yellow-50': autStore.isLoadingUrl,
            'bg-white': !autStore.isLoadingUrl,
          }"
        >
          <div>
            {{ autStore.url }}
          </div>
        </div>

        <div>Loading URL: {{ autStore.isLoadingUrl }}</div>
      </div>

      <Select
        :model-value="browser"
        data-cy="select-browser"
        :options="browsers"
        item-value="displayName"
        @update:model-value="changeBrowser"
      />
    </div>

    <div
      v-if="selectorPlaygroundStore.show"
      class="mt-8px"
    >
      <SelectorPlayground
        :get-aut-iframe="getAutIframe"
        :event-manager="eventManager"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAutStore, useSpecStore } from '../store'
import Select from '@packages/frontend-shared/src/components/Select.vue'
import { gql, useMutation } from '@urql/vue'
import IconCrosshairsGPS from '~icons/mdi/crosshairs-gps'
import Icon from '@packages/frontend-shared/src/components/Icon.vue'
import { SpecRunnerHeaderFragment, SpecRunnerHeader_SetBrowserDocument, SpecRunnerHeader_BrowserFragment } from '../generated/graphql'
import SelectorPlayground from './selector-playground/SelectorPlayground.vue'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { EventManager } from './event-manager'
import type { AutIframe } from './aut-iframe'
import { togglePlayground as _togglePlayground } from './utils'

gql`
fragment SpecRunnerHeader on CurrentProject {
  id
  currentTestingType

  currentBrowser {
    id
    displayName
  }
  browsers {
    id
    ...SpecRunnerHeader_Browser
  }
}
`

gql`
fragment SpecRunnerHeader_Browser on Browser {
  id
  name
  displayName
}
`

gql`
mutation SpecRunnerHeader_SetBrowser($browserId: ID!, $specPath: String!) {
  launchpadSetBrowser(id: $browserId) {
    id
    currentBrowser {
      id
      displayName
      majorVersion
    }
    browsers {
      id
      isSelected
    }
  }
  launchOpenProject(specPath: $specPath) {
    id
  }
}
`

const setBrowser = useMutation(SpecRunnerHeader_SetBrowserDocument)

const props = defineProps<{
  gql: SpecRunnerHeaderFragment
  eventManager: EventManager
  getAutIframe: () => AutIframe
  width?: number
}>()

const autIframe = props.getAutIframe()

const selectorPlaygroundStore = useSelectorPlaygroundStore()

const togglePlayground = () => _togglePlayground(autIframe)

const specStore = useSpecStore()

// Have to spread gql props since binding it to v-model causes error when testing
const browser = ref({ ...props.gql.currentBrowser })
const browsers = computed(() => props.gql.browsers?.slice().map((browser) => ({ ...browser })) ?? [])

function changeBrowser (browser: SpecRunnerHeader_BrowserFragment) {
  const activeSpec = specStore.activeSpec

  if (props.gql.currentBrowser?.id === browser.id || !activeSpec) {
    return
  }

  setBrowser.executeMutation({ browserId: browser.id, specPath: activeSpec.absolute })
}

const autStore = useAutStore()

const isDisabled = computed(() => autStore.isRunning || autStore.isLoading)
</script>

<style scoped lang="scss">
.url {
  @apply flex items-center justify-center;
}
</style>
