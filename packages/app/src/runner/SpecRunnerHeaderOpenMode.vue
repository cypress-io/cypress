<template>
  <div
    id="spec-runner-header"
    class="min-h-64px px-16px text-14px"
    :style="{ width: `${props.width}px` }"
  >
    <div class="flex flex-grow flex-wrap py-16px gap-12px justify-end">
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
        class="border rounded flex flex-grow border-1px border-gray-100 h-32px align-middle overflow-hidden"
        :class="{
          'bg-gray-50': autStore.isLoadingUrl
        }"
      >
        <Button
          data-cy="playground-activator"
          :disabled="isDisabled"
          class="rounded-none border-r-1px border-gray-100 mr-12px"
          variant="text"
          @click="togglePlayground"
        >
          <i-cy-crosshairs_x16 class="icon-dark-gray-600" />
        </Button>
        <div class="mr-12px max-w-100% grid text-gray-600 items-center truncate">
          {{ autStore.url }}
        </div>
      </div>
      <div
        v-else
        class="flex-grow"
      >
        <Button
          data-cy="playground-activator"
          :disabled="isDisabled"
          class=" border-gray-100 mr-12px"
          variant="outline"
          @click="togglePlayground"
        >
          <i-cy-crosshairs_x16 class="icon-dark-gray-600" />
        </Button>
      </div>
      <SpecRunnerDropdown
        v-if="selectedBrowser?.displayName"
        data-cy="select-browser"
      >
        <template #heading>
          <img
            class="min-w-16px w-16px"
            :src="allBrowsersIcons[selectedBrowser.displayName]"
          > {{ selectedBrowser.displayName }} {{ selectedBrowser.majorVersion }}
        </template>

        <template #default>
          <div class="max-h-50vh overflow-auto">
            <VerticalBrowserListItems
              :gql="props.gql"
              :spec-path="activeSpecPath"
            />
          </div>
        </template>
      </SpecRunnerDropdown>
      <SpecRunnerDropdown
        variant="panel"
        data-cy="viewport"
      >
        <template #heading>
          <i-cy-ruler_x16 class="icon-dark-gray-500 icon-light-gray-400" />
          <span class="whitespace-nowrap">{{ autStore.viewportWidth }}x{{ autStore.viewportHeight }}</span>
          <span
            v-if="displayScale"
            class="-mr-6px text-gray-500"
          >({{ displayScale }})</span>
        </template>
        <template #default>
          <div class="max-h-50vw p-16px text-gray-600 leading-24px w-400px overflow-auto">
            <!-- TODO: This copy is a placeholder based on the old message for this, we should confirm the exact copy and then move to i18n -->
            <p class="mb-16px">
              The
              <strong>viewport</strong> determines the width and height of your application.
              By default the viewport will be
              <strong>{{ autStore.defaultViewportWidth }}px</strong> by
              <strong>{{ autStore.defaultViewportHeight }}px</strong> for {{ props.gql.currentTestingType === "e2e" ? 'End-to-end' : 'Component' }}
              Testing unless specified by a <InlineCodeFragment>cy.viewport</InlineCodeFragment> command.
            </p>
            <p class="mb-16px">
              Additionally, you can override the default viewport dimensions by specifying these values in your config file:
            </p>

            <ShikiHighlight
              class="rounded border-1 border-gray-200 mb-16px"
              lang="javascript"
              :code="code"
            />
            <p>
              <ExternalLink href="https://on.cypress.io/viewport">
                Read more about viewport here.
              </ExternalLink>
            </p>
          </div>
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
import { gql } from '@urql/vue'
import type { SpecRunnerHeaderFragment } from '../generated/graphql'
import SelectorPlayground from './selector-playground/SelectorPlayground.vue'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { EventManager } from './event-manager'
import type { AutIframe } from './aut-iframe'
import { togglePlayground as _togglePlayground } from './utils'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import ShikiHighlight from '@packages/frontend-shared/src/components/ShikiHighlight.vue'
import VerticalBrowserListItems from '@packages/frontend-shared/src/gql-components/topnav/VerticalBrowserListItems.vue'
import InlineCodeFragment from '@packages/frontend-shared/src/components/InlineCodeFragment.vue'
import SpecRunnerDropdown from './SpecRunnerDropdown.vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'

gql`
fragment SpecRunnerHeader on CurrentProject {
  id
  currentTestingType

  currentBrowser {
    id
    displayName
    majorVersion
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

const props = defineProps<{
  gql: SpecRunnerHeaderFragment
  eventManager: EventManager
  getAutIframe: () => AutIframe
  width?: number
}>()

const autIframe = props.getAutIframe()

const displayScale = computed(() => {
  return autStore.scale < 1 ? `${Math.round(autStore.scale * 100) }%` : 0
})

const selectorPlaygroundStore = useSelectorPlaygroundStore()

const togglePlayground = () => _togglePlayground(autIframe)

// Have to spread gql props since binding it to v-model causes error when testing
const selectedBrowser = ref({ ...props.gql.currentBrowser })

const autStore = useAutStore()

const specStore = useSpecStore()

const activeSpecPath = specStore.activeSpec?.absolute

const isDisabled = computed(() => autStore.isRunning || autStore.isLoading)

const code = `{
  "viewportWidth": ${autStore.defaultViewportWidth},
  "viewportHeight": ${autStore.defaultViewportHeight}
}`
</script>
