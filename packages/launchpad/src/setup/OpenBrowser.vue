<template>
  <template
    v-if="query.data.value?.currentProject"
  >
    <WarningList :gql="query.data.value" />
    <LaunchpadHeader
      :title="t('setupWizard.chooseBrowser.title')"
      :description="t('setupWizard.chooseBrowser.description')"
    />
    <OpenBrowserList
      variant=""
      :gql="query.data.value.currentProject"
      @navigated-back="backFn"
      @launch="launch"
    />
  </template>
</template>

<script lang="ts" setup>
import { useMutation, gql, useQuery } from '@urql/vue'
import OpenBrowserList from './OpenBrowserList.vue'
import WarningList from '../warning/WarningList.vue'
import { OpenBrowserDocument, OpenBrowser_ClearTestingTypeDocument, OpenBrowser_LaunchProjectDocument } from '../generated/graphql'
import LaunchpadHeader from './LaunchpadHeader.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
query OpenBrowser {
  currentProject {
    id
    currentTestingType
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
mutation OpenBrowser_LaunchProject ($testingType: TestingTypeEnum!, $browserPath: String!)  {
  launchOpenProject
  # Removing for now until we decide what the behavior should be
  # hideBrowserWindow
  setProjectPreferences(testingType: $testingType, browserPath: $browserPath) {
    currentProject {
      id
      title
    }
  }
}
`

const launchOpenProject = useMutation(OpenBrowser_LaunchProjectDocument)
const clearCurrentTestingType = useMutation(OpenBrowser_ClearTestingTypeDocument)

const launch = (browserPath?: string) => {
  const testingType = query.data.value?.currentTestingType

  if (browserPath && testingType) {
    launchOpenProject.executeMutation({
      browserPath,
      testingType,
    })
  }
}

const backFn = () => {
  clearCurrentTestingType.executeMutation({})
}
</script>
