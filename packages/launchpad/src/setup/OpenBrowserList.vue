<template>
  <form @submit.prevent="$emit('launch')" v-if="props.gql.browsers">
    <div class="flex gap-6 py-16 justify-center flex-wrap">
      <div
        v-for="browser of props.gql.browsers"
        class="text-center w-160px pt-6 pb-4 block border-1 rounded relative"
        :key="browser.id"
        :class="{
          'border-indigo-300 ring-2 ring-indigo-50': browser.isSelected,
          'border-gray-200': !browser.isSelected,
          'filter grayscale bg-gray-100': browser.disabled,
          'hover:border-indigo-200 hover:ring-2 hover:ring-indigo-50': !browser.disabled && !browser.isSelected
        }"
      >
        <input
          type="radio"
          :id="browser.id"
          :value="browser.id"
          :disabled="browser.disabled"
          :key="browser.id"
          class="absolute opacity-0"
          :class="{
            'filter grayscale': browser.disabled
          }"
          @click="setSelected(browser.id)"
        />
        <label :for="browser.id" class="radio-label">
          <div class="text-center">
            <img :src="allBrowsersIcons[browser.displayName]" alt class="w-40px h-40px inline" />
          </div>
          <div class="text-indigo-600 text-lg pt-2">{{ browser.displayName }}</div>
          <div class="text-gray-400 text-xs">{{ browser.majorVersion }}</div>
        </label>
      </div>
    </div>
    <div class="mb-14">
      <div class="flex justify-center items-center mb-4">
        <Button
          v-if="launchText"
          type="submit"
          class="mr-2 py-2 px-6 inline"
          :suffix-icon="openInNew"
          data-testid="launch-button"
        >{{ launchText }}</Button>
        <Button
          @click="$emit('navigated-back')"
          type="button"
          class="ml-2 py-2 px-6 inline"
          variant="outline"
        >{{t('setupPage.step.back')}}</Button>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { gql } from "@urql/core";
import { useI18n } from '../composables'
import { OpenBrowserListFragment, OpenBrowserList_SetBrowserDocument } from "../generated/graphql"
import Button from "../components/button/Button.vue"
import { computed, ref, defineEmits } from "vue"
import _clone from "lodash/clone"
import openInNew from 'virtual:vite-icons/mdi/open-in-new'


import chromeIcon from "../../../../node_modules/browser-logos/src/chrome/chrome.svg?url"
import firefoxIcon from "../../../../node_modules/browser-logos/src/firefox/firefox.svg?url"
import edgeIcon from "../../../../node_modules/browser-logos/src/edge/edge.svg?url"
import electronIcon from "../../../../node_modules/browser-logos/src/electron/electron.svg?url"
import canaryIcon from "../../../../node_modules/browser-logos/src/chrome-canary/chrome-canary.svg?url"
import chromeBetaIcon from "../../../../node_modules/browser-logos/src/chrome-beta/chrome-beta.svg?url"
import chromiumIcon from "../../../../node_modules/browser-logos/src/chromium/chromium.svg?url"
import edgeBetaIcon from "../../../../node_modules/browser-logos/src/edge-beta/edge-beta.png"
import edgeCanaryIcon from "../../../../node_modules/browser-logos/src/edge-canary/edge-canary.png"
import edgeDevIcon from "../../../../node_modules/browser-logos/src/edge-dev/edge-dev.png"
import firefoxNightlyIcon from "../../../../node_modules/browser-logos/src/firefox-nightly/firefox-nightly.svg?url"
import firefoxDeveloperEditionIcon from "../../../../node_modules/browser-logos/src/firefox-developer-edition/firefox-developer-edition.svg?url"
import { useMutation } from "@urql/vue";

gql`
mutation OpenBrowserList_SetBrowser($id: ID!) {
  launchpadSetBrowser(id: $id) {
    app {
      ...OpenBrowserList
    }
  }
}
`

gql`
fragment OpenBrowserList on App {
  selectedBrowser {
    id
    displayName
  }
  browsers {
    id
    name
    family
    disabled
    isSelected
    channel
    displayName
    path
    version
    majorVersion
  }
}
`

const props = defineProps<{
  gql: OpenBrowserListFragment,
}>()

defineEmits(['navigated-back', 'launch'])

const { t } = useI18n()

const allBrowsersIcons = {
  'Electron': electronIcon,
  'Chrome': chromeIcon,
  'Firefox': firefoxIcon,
  'Edge': edgeIcon,
  'Chromium': chromiumIcon,
  'Canary': canaryIcon,
  'Chrome Beta': chromeBetaIcon,
  'Firefox Nightly': firefoxNightlyIcon,
  'Firefox Developer Edition': firefoxDeveloperEditionIcon,
  'Edge Canary': edgeCanaryIcon,
  'Edge Beta': edgeBetaIcon,
  'Edge Dev': edgeDevIcon,
}

const setBrowser = useMutation(OpenBrowserList_SetBrowserDocument)

const setSelected = (browserId: string) => {
  setBrowser.executeMutation({ id: browserId })
}

const launchText = computed(() => props.gql.selectedBrowser ? `${t('setupPage.openBrowser.launch')} ${props.gql.selectedBrowser.displayName}` : '')
</script>

<style scoped>
/* Make whole card clickable */
.radio-label::before {
  position: absolute;
  top: 0;
  left: 0;
  content: "";
  height: 100%;
  width: 100%;
}
</style>
