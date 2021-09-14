<template>
  <form @submit.prevent="$emit('launch')" v-if="displayBrowsers">
    <div class="flex gap-6 py-16 justify-center flex-wrap">
      <div
        v-for="browser of displayBrowsers"
        class="text-center w-160px pt-6 pb-4 block border-1 rounded relative"
        :class="{
          'border-indigo-300 ring-2 ring-indigo-50': selectedBrowser.displayName === browser.displayName,
          'border-gray-200': selectedBrowser.displayName !== browser.displayName,
          'filter grayscale bg-gray-100': browser.disabled,
          'hover:border-indigo-200 hover:ring-2 hover:ring-indigo-50': !browser.disabled && selectedBrowser.displayName !== browser.displayName
        }"
      >
        <input
          type="radio"
          v-model="selectedBrowser"
          name="selectedBrowser"
          :id="browser.displayName"
          :value="browser"
          :disabled="browser.disabled"
          :key="browser.displayName"
          class="absolute opacity-0"
          :class="{
            'filter grayscale': browser.disabled
          }"
        />
        <label :for="browser.displayName" class="radio-label">
          <div class="text-center">
            <img :src="browser.icon" alt class="w-40px h-40px inline" />
          </div>
          <div class="radio-label-text text-indigo-600 text-lg pt-2">{{ browser.displayName }}</div>
          <div class="text-gray-400 text-sm">{{ browser.displayVersion }}</div>
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
        >{{ launchText }}</Button>
        <Button @click="goBack" type="submit" class="ml-2 py-2 px-6 inline" variant="outline">Back</Button>
      </div>
      <Button
        v-if="showExpandButton"
        variant="text"
        type="button"
        class="mx-auto text-indigo-600"
        @click="expandBrowserList"
      >Choose a different browser</Button>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { gql } from "@urql/core";
import type { OpenBrowserListFragment } from "../generated/graphql"
import Button from "../components/button/Button.vue"
import Select from "../components/input/Select.vue"
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
import edgeCanaryIcon from "../../../../node_modules/browser-logos/src/chrome-canary/chrome-canary.svg?url"
import edgeDevIcon from "../../../../node_modules/browser-logos/src/edge-dev/edge-dev.png"
import firefoxNightlyIcon from "../../../../node_modules/browser-logos/src/firefox-nightly/firefox-nightly.svg?url"
import firefoxDeveloperEditionIcon from "../../../../node_modules/browser-logos/src/firefox-developer-edition/firefox-developer-edition.svg?url"
import { browsers } from "@packages/types";

gql`fragment OpenBrowserList on App {
  browsers {
      name
      family
      channel
      displayName
      path
      version
      majorVersion
  }
}`

const props = defineProps<{
  gql: OpenBrowserListFragment,
  variant?: "advanced" | "basic"
}>()

const emit = defineEmits(['navigated-back', 'launch'])

const defaultBrowserDisplayNames = ['Electron', 'Chrome', 'Firefox', 'Edge']

const allBrowsers = [{
  displayName: 'Electron',
  icon: electronIcon,
}, {
  displayName: 'Chrome',
  icon: chromeIcon,
}, {
  displayName: 'Firefox',
  icon: firefoxIcon,
}, {
  displayName: 'Edge',
  icon: edgeIcon,
}, {
  displayName: 'Chromium',
  icon: chromiumIcon
}, {
  displayName: 'Canary',
  icon: canaryIcon
}, {
  displayName: 'Chrome Beta',
  icon: chromeBetaIcon
}, {
  displayName: 'Firefox Nightly',
  icon: firefoxNightlyIcon
},{
  displayName: 'Firefox Developer Edition',
  icon: firefoxDeveloperEditionIcon
},{
  displayName: 'Edge Canary',
  icon: edgeCanaryIcon
},{
  displayName: 'Edge Beta',
  icon: edgeBetaIcon
},{
  displayName: 'Edge Dev',
  icon: edgeDevIcon
}]

const getBroswerDetails = (browser) => {
  const targetBrowser = props.gql.browsers
    .find(browserInList => browserInList.displayName === browser.displayName)

  if (targetBrowser) {
    return {
      displayName: targetBrowser.displayName,
      optionName: targetBrowser.displayName,
      displayVersion: `v${targetBrowser.majorVersion}.x`,
      icon: browser.icon,
    }
  } else if (defaultBrowserDisplayNames.includes(browser.displayName)) {
    return {
      ...browser,
      disabled: true,
      displayVersion: 'Not Detected'
    }
  } else {
    return
  }
}

const isDefaultBrowser = (browser) => {
  return defaultBrowserDisplayNames.includes(browser.displayName)
}

const isDefaultOrDetected = (browser) => {
  return isDefaultBrowser(browser) || props.gql.browsers
    .find(browserInList => browserInList.displayName === browser.displayName)
}

const isBrowserListExpanded = ref(false)

const displayBrowsers = computed(() => {
  const browserGroup = isBrowserListExpanded.value ? allBrowsers : allBrowsers.filter(isDefaultBrowser)
  return browserGroup.filter(isDefaultOrDetected).map(getBroswerDetails)
})

const selectedBrowser = ref(displayBrowsers.value[0])

const expandBrowserList = () => {
  isBrowserListExpanded.value = true
}

const goBack = () => {
  emit('navigated-back')
}

const launchText = computed(() => selectedBrowser.value ? `Launch ${selectedBrowser.value.displayName}` : '')

const showExpandButton = computed(() => {
  return !isBrowserListExpanded.value &&
    Boolean(props.gql.browsers.find(browser => !isDefaultBrowser(browser)))
})

</script>

<style scoped>

/* Make whole card clickable */
.radio-label::before {
  position: absolute;
  top: 0;
  left: 0;
  content: '';
  height: 100%;
  width: 100%;
}
</style>
