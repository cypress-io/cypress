<template>
  <div
    :style="{ width: `${props.width}px` }"
    class="h-64px mx-16px grid items-center"
  >
    <div class="flex gap-12px justify-between">
      <!--
        TODO: Studio. Out of scope for GA.
      <Button
        data-cy="header-studio"
        :disabled="isDisabled"
        class="m-16px mr-12px"
        variant="outline"
        @click="togglePlayground"
      >
        <i-cy-action-record_x16 class="h-32px w-32px" />
      </Button>
      -->
      <div
        v-if="props.gql.currentTestingType === 'e2e'"
        data-cy="aut-url"
        class="border rounded flex flex-grow border-1px border-solid-gray-100 h-32px align-middle"
      >
        <Button
          data-cy="header-selector"
          :disabled="isDisabled"
          class="rounded-none border-r-1px border-solid-gray-100 mr-12px"
          variant="text"
          @click="togglePlayground"
        >
          <i-cy-crosshairs_x16 class="icon-dark-gray-600" />
        </Button>
        <div
          class="grid items-center"
          :class="{
            'bg-yellow-50': autStore.isLoadingUrl,
            'bg-white': !autStore.isLoadingUrl,
          }"
        >
          {{ autStore.url }}
        </div>
      </div>

      <!-- <Select
        :model-value="browser"
        data-cy="select-browser"
        :options="browsers"
        item-value="displayName"
        size="sm"
        @update:model-value="changeBrowser"
      /> -->

      <SpecRunnerDropdown v-if="selectedBrowser">
        <template #heading>
          {{ selectedBrowser.displayName }}
        </template>
        <template #default>
          <VerticalBrowserListItems
            :gql="props.gql"
          />
        </template>
      </SpecRunnerDropdown>
      <SpecRunnerDropdown variant="panel">
        <template #heading>
          Viewport
        </template>
        <template #default>
          <p>
            The
            <strong>viewport</strong> determines the width and height of your application. By default the viewport will be
            <strong>{` ${defaults.width}`}px</strong> by
            <strong>{` ${defaults.height}`}px</strong>
            unless specified by a
            {' '}
            <code>cy.viewport</code> command.
          </p>
          <p>Additionally you can override the default viewport dimensions by specifying these values in your {configFileFormatted(config.configFile)}.</p>
          <pre>
            {
  "viewportWidth": ${defaults.width},
  "viewportHeight": ${defaults.height}
}
          </pre>
          <p>
            <ExternalLink href="https://on.cypress.io/viewport">
              Read more about viewport here.
            </ExternalLink>
          </p>
        </template>
      </SpecRunnerDropdown>
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
import { gql, useMutation } from '@urql/vue'
import { SpecRunnerHeaderFragment, SpecRunnerHeader_SetBrowserDocument, SpecRunnerHeader_BrowserFragment } from '../generated/graphql'
import SelectorPlayground from './selector-playground/SelectorPlayground.vue'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { EventManager } from './event-manager'
import type { AutIframe } from './aut-iframe'
import { togglePlayground as _togglePlayground } from './utils'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import VerticalBrowserListItems from '@packages/frontend-shared/src/gql-components/topnav/VerticalBrowserListItems.vue'
import SpecRunnerDropdown from './SpecRunnerDropdown.vue'

gql`
fragment SpecRunnerHeader on CurrentProject {
  id
  currentTestingType

  currentBrowser {
    id
    displayName
  }
  config
  ...VerticalBrowserListItems
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
const selectedBrowser = ref({ ...props.gql.currentBrowser })
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
