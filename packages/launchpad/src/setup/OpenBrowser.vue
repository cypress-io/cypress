<template>
  <WizardLayout
    no-container
    :can-navigate-forward="false"
    :show-next="false"
    #="{backFn}"
  >
    <div v-if="!query.data.value?.currentProject">
      Loading browsers...
    </div>
    <OpenBrowserList
      v-else
      variant=""
      :gql="query.data.value.currentProject"
      @navigated-back="backFn"
      @launch="launch"
    />
  </WizardLayout>
</template>

<script lang="ts" setup>
import { useMutation, gql, useQuery } from '@urql/vue'
import OpenBrowserList from './OpenBrowserList.vue'
import WizardLayout from './WizardLayout.vue'
import { OpenBrowserDocument, OpenBrowser_LaunchProjectDocument } from '../generated/graphql'

gql`
query OpenBrowser {
  currentProject {
    id
    ...OpenBrowserList
  }
  wizard {
    testingType
  }
}
`

const query = useQuery({ query: OpenBrowserDocument })

gql`
mutation OpenBrowser_LaunchProject ($testingType: TestingTypeEnum!, $browserPath: String!)  {
  launchOpenProject
  hideBrowserWindow
  setProjectPreferences(testingType: $testingType, browserPath: $browserPath) {
    currentProject {
      id
      title
    }
  }
}
`

const launchOpenProject = useMutation(OpenBrowser_LaunchProjectDocument)

const launch = (browserPath?: string) => {
  const testingType = query.data.value?.wizard?.testingType

  if (browserPath && testingType) {
    launchOpenProject.executeMutation({
      browserPath,
      testingType,
    })
  }
}

</script>
