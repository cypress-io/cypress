<template>
  <div
    id="spec-runner-header"
    ref="autHeaderEl"
    class="h-full bg-gray-1100 border-l-[1px] border-gray-900 min-h-[64px] text-[14px]"
  >
    <div class="flex flex-wrap grow p-[16px] gap-[12px] h-[64px] flex-nowrap">
      <button
        v-if="!studioBetaAvailable"
        data-cy="playground-activator"
        :disabled="isDisabled"
        class="bg-gray-1100 border rounded-md flex h-full border-gray-800 outline-solid outline-indigo-500 transition w-[40px] duration-150 items-center justify-center hover:bg-gray-800"
        :aria-label="t('runner.selectorPlayground.toggle')"
        :class="[selectorPlaygroundStore.show ? 'bg-gray-800 border-gray-700' : 'bg-gray-1100']"
        @click="togglePlayground"
      >
        <i-cy-crosshairs_x16 class="icon-dark-gray-300" />
      </button>
      <div
        data-cy="aut-url"
        class="aut-url-container border rounded flex bg-gray-950 grow border-gray-800 h-[32px] align-middle"
      >
        <SpecRunnerDropdown
          v-if="selectedBrowser?.displayName"
          data-cy="select-browser"
          :disabled="autStore.isRunning"
        >
          <template #heading>
            <component
              :is="allBrowsersIcons[selectedBrowser.displayName?.toLowerCase()] || allBrowsersIcons.generic"
              class="min-w-[16px] w-[16px]"
              :alt="selectedBrowser.majorVersion ? `${selectedBrowser.displayName} ${selectedBrowser.majorVersion}` : selectedBrowser.displayName"
            />
          </template>
          <template #default>
            <div class="max-h-[50vh] overflow-auto">
              <VerticalBrowserListItems
                :gql="props.gql"
                :spec-path="activeSpecPath"
              />
            </div>
          </template>
        </SpecRunnerDropdown>
        <input
          ref="autUrlInputRef"
          data-cy="aut-url-input"
          :readonly="urlReadOnly"
          :value="inputValue"
          :placeholder="inputPlaceholder"
          aria-label="url of the application under test"
          class="aut-url-input bg-transparent text-gray-300 outline-none text-base font-normal leading-6 flex grow mr-[12px] max-w-full self-center truncate w-full placeholder:text-gray-400 placeholder:text-base placeholder:font-normal placeholder:leading-6 focus:text-indigo-300 focus-visible:outline-none"
          @input="setStudioUrl"
          @click="openExternally"
          @keyup.enter="visitUrl"
        >

        <Tag
          data-cy="viewport-size"
          size="20"
          color="gray-dark"
          :outline="true"
          class="self-center mr-[5px] pr-[6px] pl-[6px] viewport-tag"
        >
          <span class="whitespace-nowrap text-[12px]">{{ autStore.viewportWidth }}x{{
            autStore.viewportHeight
          }}</span>
        </Tag>
        <Tag
          v-if="displayScale"
          data-cy="viewport-scale"
          size="20"
          color="gray-dark"
          :outline="true"
          class="self-center mr-[5px] pr-[6px] pl-[6px] viewport-tag"
        >
          <span class="text-[12px]">
            {{ displayScale }}
          </span>
        </Tag>
      </div>
      <StudioButton
        v-if="shouldShowStudioButton"
        :event-manager="eventManager"
      />
    </div>

    <SelectorPlayground
      v-if="selectorPlaygroundStore.show"
      :get-aut-iframe="getAutIframe"
      :event-manager="eventManager"
    />
    <Alert
      v-model="showAlert"
      status="success"
      dismissible
    >
      <template #title>
        <i-cy-book_x16 class="pr-[2px] inline-block icon-dark-indigo-500 icon-light-indigo-200" />
        <ExternalLink href="https://on.cypress.io/styling-components">
          {{ t('runner.header.reviewDocs') }}
        </ExternalLink>
        {{ t('runner.header.troubleRendering') }}
      </template>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useAutStore, useSpecStore, useSelectorPlaygroundStore } from '../store'
import { useAutHeader } from './useAutHeader'
import { gql } from '@urql/vue'
import { useI18n } from 'vue-i18n'
import type { SpecRunnerHeaderFragment } from '../generated/graphql'
import type { EventManager } from './event-manager'
import type { AutIframe } from './aut-iframe'
import { togglePlayground as _togglePlayground } from './utils'
import Tag from '@cypress-design/vue-tag'
import SelectorPlayground from './selector-playground/SelectorPlayground.vue'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import Alert from '@packages/frontend-shared/src/components/Alert.vue'

import VerticalBrowserListItems from '@packages/frontend-shared/src/gql-components/topnav/VerticalBrowserListItems.vue'
import SpecRunnerDropdown from './SpecRunnerDropdown.vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import { useStudioStore } from '../store/studio-store'
import { useExternalLink } from '@cy/gql-components/useExternalLink'
import StudioButton from '../studio/StudioButton.vue'

gql`
fragment SpecRunnerHeader on CurrentProject {
  id
  configFile
  currentTestingType
  activeBrowser {
    id
    displayName
    majorVersion
  }
  config
  ...VerticalBrowserListItems
}
`

const { t } = useI18n()

const autStore = useAutStore()

const specStore = useSpecStore()

const route = useRoute()

const studioStore = useStudioStore()

const urlInProgress = ref('')

const autUrlInputRef = ref<HTMLInputElement>()

const props = defineProps<{
  gql: SpecRunnerHeaderFragment
  eventManager: EventManager
  getAutIframe: () => AutIframe
  shouldShowStudioButton: boolean
  studioBetaAvailable: boolean
}>()

const showAlert = ref(false)

const { autHeaderEl } = useAutHeader()

watchEffect(() => {
  showAlert.value = route.params.shouldShowTroubleRenderingAlert === 'true'
})

const autIframe = props.getAutIframe()

const displayScale = computed(() => {
  return autStore.scale < 1 ? `${Math.round(autStore.scale * 100) }%` : 0
})

const autUrl = computed(() => {
  return autStore.url
})

const selectorPlaygroundStore = useSelectorPlaygroundStore()

const togglePlayground = () => _togglePlayground(autIframe)

// Have to spread gql props since binding it to v-model causes error when testing
const selectedBrowser = ref({ ...props.gql.activeBrowser })

const activeSpecPath = specStore.activeSpec?.absolute

const isDisabled = computed(() => autStore.isRunning || autStore.isLoading)

const urlReadOnly = computed(() => !studioStore.needsUrl || props.gql.currentTestingType === 'component')

const inputPlaceholder = computed(() => {
  if (props.gql.currentTestingType === 'component') {
    return 'URL navigation disabled in component testing'
  }

  if (studioStore.needsUrl) {
    return 'Enter URL'
  }

  return ''
})

const inputValue = computed(() => {
  if (props.gql.currentTestingType === 'component') {
    return ''
  }

  return studioStore.needsUrl ? urlInProgress.value : autUrl.value
})

const openExternal = useExternalLink()

function setStudioUrl (event: Event) {
  const url = (event.currentTarget as HTMLInputElement).value

  urlInProgress.value = url
}

function visitUrl () {
  studioStore.setUrl(urlInProgress.value)
  // once we set the url in studio, we can clear the urlInProgress
  // since we'll rerun the test which will set the url in the autStore
  urlInProgress.value = ''
}

function openExternally () {
  if (!autStore.url || studioStore.needsUrl) {
    return
  }

  openExternal(autStore.url)
}
</script>

<style scoped>
.aut-url-container {
  border: 1px solid #434861;
  padding: 1px;
  background-color: #25283c;
  border-radius: 4px;
}

.aut-url-container:hover {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.aut-url-container:focus-within,
.aut-url-container:focus-visible,
.aut-url-container:focus {
  border: 2px solid #9aa2fc;
  padding: 0;
  box-shadow: 0 0 0 1px rgba(154, 162, 252, 0.35);
  background-color: #25283c;
}

/* Override Tag component border-radius with higher specificity */
.viewport-tag {
  border-radius: 12px !important;
}
</style>
