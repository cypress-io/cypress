<template>
  <div
    id="spec-runner-header"
    ref="autHeaderEl"
    class="min-h-[64px] text-[14px]"
  >
    <div class="flex flex-wrap grow p-[16px] gap-[12px] justify-end">
      <div
        v-if="props.gql.currentTestingType === 'e2e'"
        data-cy="aut-url"
        class="border rounded flex grow border-gray-100 h-[32px] overflow-hidden align-middle"
        :class="{
          'bg-gray-50': autStore.isLoadingUrl
        }"
      >
        <Button
          data-cy="playground-activator"
          :disabled="isDisabled"
          class="rounded-none border-gray-100 border-r-[1px] mr-[12px]"
          variant="text"
          :aria-label="t('runner.selectorPlayground.toggle')"
          @click="togglePlayground"
        >
          <i-cy-crosshairs_x16 :class="[selectorPlaygroundStore.show ? 'icon-dark-indigo-500' : 'icon-dark-gray-500']" />
        </Button>
        <input
          ref="autUrlInputRef"
          :value="studioStore.needsUrl ? urlInProgress : autUrl"
          data-cy="aut-url-input"
          aria-label="url of the application under test"
          class="flex grow mr-[12px] leading-normal max-w-full text-indigo-500 z-51 self-center hocus-link-default truncate"
          @input="setStudioUrl"
          @click="openExternally"
          @keyup.enter="visitUrl"
        >
        <StudioUrlPrompt
          v-if="studioStore.needsUrl"
          :aut-url-input-ref="autUrlInputRef"
          :url-in-progress="urlInProgress"
          @submit="visitUrl"
          @cancel="() => eventManager.emit('studio:cancel', undefined)"
        />
      </div>

      <div
        v-else
        class="grow"
      >
        <Button
          data-cy="playground-activator"
          :disabled="isDisabled"
          class="border-gray-100 mr-[12px]"
          variant="outline"
          :aria-label="t('runner.selectorPlayground.toggle')"
          @click="togglePlayground"
        >
          <i-cy-crosshairs_x16 :class="[selectorPlaygroundStore.show ? 'icon-dark-indigo-500' : 'icon-dark-gray-500']" />
        </Button>
      </div>
      <SpecRunnerDropdown
        v-if="selectedBrowser?.displayName"
        data-cy="select-browser"
        :disabled="autStore.isRunning"
      >
        <template #heading>
          <img
            class="min-w-[16px] w-[16px]"
            :src="allBrowsersIcons[selectedBrowser.displayName] || allBrowsersIcons.generic"
            :alt="selectedBrowser.displayName"
          >
          {{ selectedBrowser.displayName }} {{ selectedBrowser.majorVersion }}
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
      <SpecRunnerDropdown
        variant="panel"
        data-cy="viewport"
      >
        <template #heading>
          <i-cy-ruler_x16 class="icon-dark-gray-500 icon-light-gray-400" />
          <span class="whitespace-nowrap">{{ autStore.viewportWidth }}x{{ autStore.viewportHeight }}</span>
          <span
            v-if="displayScale"
            class="ml-[-6px] text-gray-500"
          >
            ({{ displayScale }})
          </span>
        </template>
        <template #default>
          <div class="max-h-50vw p-[24px] pt-5 text-gray-700 leading-5 w-[346px] overflow-auto">
            <i18n-t
              tag="p"
              keypath="runner.viewportTooltip.infoText"
              class="mb-[24px]"
            >
              <strong class="font-bold">{{ autStore.defaultViewportWidth }}px</strong>
              <strong class="font-bold">{{ autStore.defaultViewportHeight }}px</strong>
              {{ props.gql.currentTestingType === "e2e" ? 'end-to-end' : 'component' }}
            </i18n-t>

            <i18n-t
              tag="p"
              keypath="runner.viewportTooltip.configText"
              class="mb-[24px]"
            >
              <template #configFile>
                <!-- disable rule to prevent trailing space from being added to <InlineCodeFragment/> content -->
                <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
                <InlineCodeFragment class="font-medium text-xs leading-5">{{ props.gql.configFile }}</InlineCodeFragment>
              </template>
              <template #viewportCommand>
                <!-- disable rule to prevent trailing space from being added to <InlineCodeFragment/> content -->
                <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
                <InlineCodeFragment class="font-medium text-xs leading-5">cy.viewport()</InlineCodeFragment>
              </template>
            </i18n-t>
            <div class="flex justify-center">
              <Button
                class="font-medium"
                data-cy="viewport-docs"
                :prefix-icon="BookIcon"
                prefix-icon-class="icon-dark-indigo-500"
                variant="outline"
                :href="t('runner.viewportTooltip.buttonHref')"
              >
                {{ t('runner.viewportTooltip.buttonText') }}
              </Button>
            </div>
          </div>
        </template>
      </SpecRunnerDropdown>
    </div>

    <SelectorPlayground
      v-if="selectorPlaygroundStore.show"
      :get-aut-iframe="getAutIframe"
      :event-manager="eventManager"
    />

    <StudioControls v-if="studioStore.isActive" />

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
import SelectorPlayground from './selector-playground/SelectorPlayground.vue'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import StudioControls from './studio/StudioControls.vue'
import StudioUrlPrompt from './studio/StudioUrlPrompt.vue'
import VerticalBrowserListItems from '@packages/frontend-shared/src/gql-components/topnav/VerticalBrowserListItems.vue'
import InlineCodeFragment from '@packages/frontend-shared/src/components/InlineCodeFragment.vue'
import SpecRunnerDropdown from './SpecRunnerDropdown.vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import BookIcon from '~icons/cy/book_x16'
import { useStudioStore } from '../store/studio-store'
import { useExternalLink } from '@cy/gql-components/useExternalLink'

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
  if (studioStore.isActive && studioStore.url) {
    return studioStore.url
  }

  return autStore.url
})

const selectorPlaygroundStore = useSelectorPlaygroundStore()

const togglePlayground = () => _togglePlayground(autIframe)

// Have to spread gql props since binding it to v-model causes error when testing
const selectedBrowser = ref({ ...props.gql.activeBrowser })

const activeSpecPath = specStore.activeSpec?.absolute

const isDisabled = computed(() => autStore.isRunning || autStore.isLoading)

const openExternal = useExternalLink()

function setStudioUrl (event: Event) {
  const url = (event.currentTarget as HTMLInputElement).value

  urlInProgress.value = url
}

function visitUrl () {
  studioStore.visitUrl(urlInProgress.value)
}

function openExternally () {
  if (!autStore.url || studioStore.isActive) {
    return
  }

  openExternal(autStore.url)
}
</script>
