<template>
  <form @submit.prevent="launch" v-if="variant === 'basic'">
    <div class="flex gap-6 py-16 justify-center">
      <div
        v-for="browser of displayBrowsers"
        class="text-center w-160px py-6 block border-1"
        :class="{
          'border-indigo-600 ring-3 ring-indigo-100': selectedBrowserFamily.name === browser.name,
          'border-gray-200': selectedBrowserFamily.name !== browser.name,
          'filter grayscale bg-gray-100': browser.disabled
        }"
      >
        <input
          type="radio"
          name="selectedBrowserFamily"
          :id="browser.name"
          :value="browser"
          v-model="selectedBrowserFamily"
          :disabled="browser.disabled ? 'disabled' : null"
          :key="browser.displayName"
          class="absolute opacity-0"
          :class="{
            'filter grayscale': browser.disabled
          }"
        />
        <label :for="browser.name">
          <div class="text-center">
            <img :src="browser.icon" alt class="w-16 mb-2 inline" />
          </div>
          <div class="text-indigo-600 text-xl">{{ browser.displayName }}</div>
          <div class="text-gray-600">{{ browser.displayVersion }}</div>
        </label>
      </div>
    </div>
    <div class="mb-14">
      <div class="flex justify-center mb-4">
      <Button @click="launch" type="submit" class="mr-2 py-2 px-6 inline">{{ launchText }}</Button>
      <Button @click="goBack" type="submit" class="ml-2 py-2 px-6 inline" variant="outline">Back</Button>
      </div>
      <Button
        variant="text"
        type="button"
        class="mx-auto text-indigo-600"
        @click="$emit('update:variant', 'advanced')"
      >Choose a different browser</Button>
    </div>
  </form>
  <form v-else>
    Advanced Picker
    <div class="my-12 text-left">
      <Select
        label="Browser Family"
        :options="allBrowserFamilies"
        item-key="name"
        item-value="optionName"
        v-model="selectedBrowserFamily"
      ></Select>
      <Select
        label="Browser Version"
        :options="selectedBrowserVersions"
        item-key="name"
        item-value="optionName"
        v-model="selectedBrowserVersion"
      ></Select>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { gql } from "@urql/core";
import type { OpenBrowserListFragment } from "../generated/graphql"
import Button from "../components/button/Button.vue"
import Select from "../components/input/Select.vue"
import { computed, ref, watch, defineEmits } from "vue"
import _clone from "lodash/clone"

import chromeIcon from "../../../../node_modules/browser-logos/src/chrome/chrome.svg?url"
import webkitIcon from "../../../../node_modules/browser-logos/src/webkit/webkit.svg?url"
import firefoxIcon from "../../../../node_modules/browser-logos/src/firefox/firefox.svg?url"
import edgeIcon from "../../../../node_modules/browser-logos/src/edge/edge.svg?url"
import electronIcon from "../../../../node_modules/browser-logos/src/electron/electron.svg?url"


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

const emit = defineEmits(['navigated-back', 'update:variant'])

const mainBrowserDefaults = [{
  name: 'electron',
  displayName: 'Electron',
  icon: electronIcon
}, {
  name: 'chrome',
  displayName: 'Chrome',
  icon: chromeIcon
}, {
  name: 'webkit',
  displayName: 'Safari',
  icon: webkitIcon
}, {
  name: 'firefox',
  displayName: 'Firefox',
  icon: firefoxIcon
}, {
  name: 'edge',
  displayName: 'Edge',
  icon: edgeIcon
}]

const displayBrowsers = computed(() => mainBrowserDefaults.map(getBroswerDetails))

const selectedBrowserVersions = computed(() => {
  return props.gql.browsers.filter((browser) => {
    return browser.name === selectedBrowserFamily.value.name
  }).map((browser) => {
    return {
      ...browser,
      optionName: `${browser.displayName} (v${browser.version})`
    }
  })
})

const allBrowserFamilies = computed(() => {
  const dedupedFamilies = props.gql.browsers.reduce((acc, curr) => {
    if (!acc.find(item => item.name === curr.name)) {
      const currentCopy = _clone(curr)
      currentCopy.optionName = currentCopy.displayName
      return [...acc, currentCopy]
    } else {
      return acc
    }
  }, [])

  const unavailableBrowsers = displayBrowsers.value.filter(browser => browser.disabled)

  return [...dedupedFamilies, ...unavailableBrowsers]
})

const launchText = computed(() => `Launch ${selectedBrowserFamily.value.displayName}`)

const selectedBrowserFamily = ref(mainBrowserDefaults[0])
const selectedBrowserVersion = ref(null)
const isAdvancedPicker = ref(false)

// watch(selectedBrowserFamily, () => {
//   selectedBrowserVersion.value = selectedBrowserVersions[0]
// })

const getBroswerDetails = (browserDefault) => {
  const stableVersion = props.gql.browsers
    .find(browser => browser.name === browserDefault.name && browser.channel === 'stable')
  if (stableVersion) {
    return {
      name: browserDefault.name,
      displayName: stableVersion.displayName,
      optionName: stableVersion.displayName,
      displayVersion: `v${stableVersion.majorVersion}.x`,
      icon: browserDefault.icon
    }
  } else {
    return {
      name: browserDefault.name,
      displayName: browserDefault.displayName,
      optionName: `${browserDefault.displayName} (Not Detected)`,
      displayVersion: 'Not Detected',
      icon: browserDefault.icon,
      disabled: true
    }
  }
}

const goBack = () => {
  emit('navigated-back')
}

</script>
