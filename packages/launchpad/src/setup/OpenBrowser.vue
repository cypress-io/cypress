<template>
  <WizardLayout :canNavigateForward="false" :showNext="false">
    <div class="text-center">
      <img src="../images/success.svg" class="mx-auto my-10" />
      <h1 class="text-3xl">Choose a Browser</h1>
      <p>Choose your preferred browser for testing your components.</p>
      <form @submit.prevent="launch" v-if="!isAdvancedPicker">
        <div class="flex gap-6 py-16">
          <div
            v-for="browser of displayBrowsers"
            class="text-center w-full py-6 block border-1"
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
          <Button
            @click="launch"
            type="submit"
            class="mx-auto py-2 px-6"
          >Launch {{ selectedBrowserFamily.displayName }}</Button>
          <Button
            variant="text"
            type="button"
            class="mx-auto text-indigo-600"
            @click="isAdvancedPicker = true"
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
        <div>
          <Button
            variant="text"
            type="button"
            class="mx-auto text-indigo-600"
            @click="isAdvancedPicker = false"
          >Back</Button>
        </div>
      </form>
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { gql } from "@urql/core"
import Button from "../components/button/Button.vue"
import Select from "../components/input/Select.vue";
import WizardLayout from "./WizardLayout.vue";
import { InitializeOpenProjectDocument, LaunchOpenProjectDocument, OpenBrowserWizardFragment, OpenBrowserAppFragment } from "../generated/graphql"
import { useMutation } from "@urql/vue";
import { computed, ref } from "vue"

import chromeIcon from "../../../../node_modules/browser-logos/src/chrome/chrome.svg?url"
import webkitIcon from "../../../../node_modules/browser-logos/src/webkit/webkit.svg?url"
import firefoxIcon from "../../../../node_modules/browser-logos/src/firefox/firefox.svg?url"
import edgeIcon from "../../../../node_modules/browser-logos/src/edge/edge.svg?url"
import electronIcon from "../../../../node_modules/browser-logos/src/electron/electron.svg?url"
import { browsers } from "@packages/types";
import _clone from "lodash/clone"
import { watch } from "vue";

gql`
fragment OpenBrowserApp on App {
  browsers {
    displayName
    version
    majorVersion
    name
    channel
  }
}
`

gql`
fragment OpenBrowserWizard on Wizard {
  testingType
}
`

gql`
mutation InitializeOpenProject ($testingType: TestingTypeEnum!) {
  initializeOpenProject (testingType: $testingType) {
    projects {
      __typename # don't really care about result at this point
    }
  }
}
`

gql`
mutation LaunchOpenProject ($testingType: TestingTypeEnum!) {
  launchOpenProject (testingType: $testingType) {
    projects {
      __typename # don't really care about result at this point
    }
  }
}
`


const initializeOpenProject = useMutation(InitializeOpenProjectDocument)
const launchOpenProject = useMutation(LaunchOpenProjectDocument)

const props = defineProps<{
  app: OpenBrowserAppFragment
  wizard: OpenBrowserWizardFragment
}>()

const launch = async () => {
  if (!props.wizard.testingType) {
    return
  }

  await initializeOpenProject.executeMutation({ testingType: props.wizard.testingType })
  await launchOpenProject.executeMutation({ testingType: props.wizard.testingType })
}

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
  return props.app.browsers.filter((browser) => {
    return browser.name === selectedBrowserFamily.value.name
  }).map((browser) => {
    return {
      ...browser,
      optionName: `${browser.displayName} (v${browser.version})`
    }
  }).sort((a, b) => b.version - a.version)
})

const allBrowserFamilies = computed(() => {
  const dedupedFamilies = props.app.browsers.reduce((acc, curr) => {
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

const selectedBrowserFamily = ref(mainBrowserDefaults[0])
const selectedBrowserVersion = ref(null)
const isAdvancedPicker = ref(false)

watch(selectedBrowserFamily, (newVal) => {
  const {name} = newVal;
  console.log(name)
})

const getBroswerDetails = (browserDefault) => {
  const stableVersion = props.app.browsers
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

</script>

<style scoped>
:foucs + .radio-label {
  border: 2px solid pink;
}
</style>