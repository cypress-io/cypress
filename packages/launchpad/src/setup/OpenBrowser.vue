<template>
  <template
    v-if="query.data.value?.currentProject"
  >
    <WarningList :gql="query.data.value" />
    <LaunchpadHeader
      :title="t('setupWizard.chooseBrowser.title')"
      :description="headingDescription"
    />
    <OpenBrowserList
      variant=""
      :gql="query.data.value.currentProject"
      :is-browser-open="isBrowserOpen"
      :is-browser-opening="isBrowserOpening"
      @navigated-back="backFn"
      @launch="launch"
      @close-browser="closeBrowserFn"
      @focus-browser="setFocusToActiveBrowserWindow"
    />
  </template>
</template>

<script lang="ts" setup>
import { useMutation, gql, useQuery } from '@urql/vue'
import OpenBrowserList from './OpenBrowserList.vue'
import WarningList from '../warning/WarningList.vue'
import { OpenBrowserDocument, OpenBrowser_CloseBrowserDocument, OpenBrowser_ClearTestingTypeDocument, OpenBrowser_LaunchProjectDocument, OpenBrowser_FocusActiveBrowserWindowDocument } from '../generated/graphql'
import LaunchpadHeader from './LaunchpadHeader.vue'
import { useI18n } from '@cy/i18n'
import { computed, ref } from 'vue'

const { t } = useI18n()

gql`
query OpenBrowser {
  currentProject {
    id
    currentTestingType
    isLoadingConfigFile
    isLoadingNodeEvents
    isBrowserOpen
    ...OpenBrowserList
  }
  ...WarningList
  currentTestingType
}
`

const query = useQuery({ query: OpenBrowserDocument })

gql`
mutation OpenBrowser_ClearTestingType {
  clearCurrentTestingType {
    currentTestingType
    currentProject {
      id
      currentTestingType
    }
  }
}
`

gql`
mutation OpenBrowser_LaunchProject ($testingType: TestingTypeEnum!)  {
  launchOpenProject {
    id
  }
  # Removing for now until we decide what the behavior should be
  # hideBrowserWindow
  setProjectPreferences(testingType: $testingType) {
    currentProject {
      id
      title
    }
  }
}
`

gql`
mutation OpenBrowser_CloseBrowser {
  closeBrowser
}
`

gql`
mutation OpenBrowser_FocusActiveBrowserWindow {
  focusActiveBrowserWindow
}
`

const launchOpenProject = useMutation(OpenBrowser_LaunchProjectDocument)
const clearCurrentTestingType = useMutation(OpenBrowser_ClearTestingTypeDocument)
const closeBrowser = useMutation(OpenBrowser_CloseBrowserDocument)

const launching = ref(false)
const launch = async () => {
  const testingType = query.data.value?.currentTestingType

  if (testingType && !launching.value) {
    launching.value = true
    await launchOpenProject.executeMutation({
      testingType,
    })

    launching.value = false
  }
}

const backFn = () => {
  clearCurrentTestingType.executeMutation({})
}

const closeBrowserFn = () => {
  closeBrowser.executeMutation({})
}

const isBrowserOpen = computed(() => !!query.data.value?.currentProject?.isBrowserOpen)

const isBrowserOpening = computed(() => !!launchOpenProject.fetching.value || launching.value)

const headingDescription = computed(() => {
  return t('setupWizard.chooseBrowser.description', { testingType: query.data.value?.currentProject?.currentTestingType === 'component' ? 'component' : 'E2E' })
})

const focusActiveBrowserWindow = useMutation(OpenBrowser_FocusActiveBrowserWindowDocument)

const setFocusToActiveBrowserWindow = () => {
  focusActiveBrowserWindow.executeMutation({})
}

</script>
