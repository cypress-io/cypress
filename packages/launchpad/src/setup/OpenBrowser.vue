<template>
  <WizardLayout
    no-container
    :can-navigate-forward="false"
    :show-next="false"
    #="{backFn}"
  >
    <div v-if="!query.data.value">
      Loading browsers...
    </div>
    <OpenBrowserList
      v-else
      variant=""
      :gql="query.data.value.app"
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
  app {
    ...OpenBrowserList
  }
  wizard {
    testingType
  }
}
`

const query = useQuery({ query: OpenBrowserDocument })

gql`
mutation OpenBrowser_LaunchProject ($testingType: TestingTypeEnum!, $browserId: ID!)  {
  launchOpenProject
  hideBrowserWindow

  setProjectPreferences(testingType: $testingType, browserId: $browserId) {
    activeProject {
      title
    }
  }
}
`

const launchOpenProject = useMutation(OpenBrowser_LaunchProjectDocument)

const launch = (browserId: string) => {
  launchOpenProject.executeMutation({
    browserId,
    testingType: query.data.value.wizard.testingType,
  })
}

</script>
