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
import { OpenBrowserDocument, OpenBrowser_CloseBrowserDocument, OpenBrowser_ClearTestingTypeDocument, OpenBrowser_LaunchProjectDocument, OpenBrowser_FocusActiveBrowserWindowDocument, OpenBrowser_ResetLatestVersionTelemetryDocument, OpenBrowser_LocalSettingsDocument } from '../generated/graphql'
import LaunchpadHeader from './LaunchpadHeader.vue'
import { useI18n } from '@cy/i18n'
import { computed, ref, onMounted } from 'vue'

const { t } = useI18n()

gql`
query OpenBrowser {
  currentProject {
    id
    currentTestingType
    isLoadingConfigFile
    isLoadingNodeEvents
    ...OpenBrowserList
  }
  ...WarningList
}
`

gql`
query OpenBrowser_LocalSettings {
  localSettings {
    preferences {
      shouldLaunchBrowserFromOpenBrowser
    }
  }
}
`

const query = useQuery({ query: OpenBrowserDocument })
const lsQuery = useQuery({ query: OpenBrowser_LocalSettingsDocument, requestPolicy: 'network-only' })

gql`
mutation OpenBrowser_ClearTestingType {
  clearCurrentTestingType {
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
  setProjectPreferencesInGlobalCache(testingType: $testingType) {
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

gql`
mutation OpenBrowser_ResetLatestVersionTelemetry {
  resetLatestVersionTelemetry
}
`

const launchOpenProject = useMutation(OpenBrowser_LaunchProjectDocument)
const clearCurrentTestingType = useMutation(OpenBrowser_ClearTestingTypeDocument)
const closeBrowser = useMutation(OpenBrowser_CloseBrowserDocument)
const resetLatestVersionTelemetry = useMutation(OpenBrowser_ResetLatestVersionTelemetryDocument)

const launching = ref(false)
const launch = async () => {
  const testingType = query.data.value?.currentProject?.currentTestingType

  if (testingType && !launching.value) {
    launching.value = true
    await launchOpenProject.executeMutation({
      testingType,
    })

    launching.value = false
  }
}

const launchIfBrowserSetInCli = async () => {
  const shouldLaunchBrowser = (await lsQuery).data.value?.localSettings?.preferences?.shouldLaunchBrowserFromOpenBrowser

  if (shouldLaunchBrowser) {
    await launch()
  }

  return
}

const backFn = () => {
  clearCurrentTestingType.executeMutation({})
}

const closeBrowserFn = () => {
  closeBrowser.executeMutation({})
}

const headingDescription = computed(() => {
  return t('setupWizard.chooseBrowser.description', { testingType: query.data.value?.currentProject?.currentTestingType === 'component' ? 'component' : 'E2E' })
})

const focusActiveBrowserWindow = useMutation(OpenBrowser_FocusActiveBrowserWindowDocument)

const setFocusToActiveBrowserWindow = () => {
  focusActiveBrowserWindow.executeMutation({})
}

onMounted(() => {
  resetLatestVersionTelemetry.executeMutation({})
  launchIfBrowserSetInCli()
})

</script>
