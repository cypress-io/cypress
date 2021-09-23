<template>
  <form
    v-if="props.gql.browsers"
    @submit.prevent="$emit('launch')"
  >
    <div class="flex gap-6 py-16 justify-center flex-wrap">
      <div
        v-for="browser of props.gql.browsers"
        :key="browser.id"
        class="text-center w-160px pt-6 pb-4 block border-1 rounded relative"
        :class="{
          'border-indigo-300 ring-2 ring-indigo-50': selectedBrowser.displayName === browser.displayName && selectedBrowser.version === browser.version,
          'border-gray-200': selectedBrowser.displayName !== browser.displayName,
          'filter grayscale bg-gray-100': browser.disabled,
          'hover:border-indigo-200 hover:ring-2 hover:ring-indigo-50': !browser.disabled && selectedBrowser.displayName !== browser.displayName
        }"
      >
        <input
          :id="browser.id"
          :key="browser.id"
          type="radio"
          :value="browser.id"
          :disabled="browser.disabled"
          class="absolute opacity-0"
          :class="{
            'filter grayscale': browser.disabled
          }"
          @click="setSelected(browser.id)"
        >
        <label
          :for="browser.id"
          class="radio-label"
        >
          <div class="text-center">
            <img
              :src="allBrowsersIcons[browser.displayName]"
              alt
              class="w-40px h-40px inline"
            >
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
        >
          {{ launchText }}
        </Button>
        <Button
          type="button"
          class="ml-2 py-2 px-6 inline"
          variant="outline"
          @click="$emit('navigated-back')"
        >
          {{ t('setupPage.step.back') }}
        </Button>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useI18n } from '../composables'
import type { OpenBrowserListFragment } from '../generated/graphql'
import Button from '../components/button/Button.vue'
import { computed, ref, defineEmits } from 'vue'
import _clone from 'lodash/clone'
import openInNew from 'virtual:vite-icons/mdi/open-in-new'

import chromeIcon from '../../../../node_modules/browser-logos/src/chrome/chrome.svg?url'
import firefoxIcon from '../../../../node_modules/browser-logos/src/firefox/firefox.svg?url'
import edgeIcon from '../../../../node_modules/browser-logos/src/edge/edge.svg?url'
import electronIcon from '../../../../node_modules/browser-logos/src/electron/electron.svg?url'
import canaryIcon from '../../../../node_modules/browser-logos/src/chrome-canary/chrome-canary.svg?url'
import chromeBetaIcon from '../../../../node_modules/browser-logos/src/chrome-beta/chrome-beta.svg?url'
import chromiumIcon from '../../../../node_modules/browser-logos/src/chromium/chromium.svg?url'
import edgeBetaIcon from '../../../../node_modules/browser-logos/src/edge-beta/edge-beta.png'
import edgeCanaryIcon from '../../../../node_modules/browser-logos/src/edge-canary/edge-canary.png'
import edgeDevIcon from '../../../../node_modules/browser-logos/src/edge-dev/edge-dev.png'
import firefoxNightlyIcon from '../../../../node_modules/browser-logos/src/firefox-nightly/firefox-nightly.svg?url'
import firefoxDeveloperEditionIcon from '../../../../node_modules/browser-logos/src/firefox-developer-edition/firefox-developer-edition.svg?url'

gql`
fragment OpenBrowserList on App {
  browsers {
    id
    name
    family
    disabled
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

const selectedBrowser = ref(props.gql.browsers[0])

const setSelected = (browserId: string) => {
  const selected = props.gql.browsers.find((b) => b.id === browserId)

  if (selected) {
    selectedBrowser.value = selected
  }
}

const launchText = computed(() => selectedBrowser.value ? `${t('setupPage.openBrowser.launch')} ${selectedBrowser.value.displayName}` : '')
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
