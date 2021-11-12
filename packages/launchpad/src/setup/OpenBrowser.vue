<template>
  <OpenBrowserList
    variant=""
    :gql="props.gql"
    @navigated-back="backFn"
    @launch="launch"
  />
</template>

<script lang="ts" setup>
import { useMutation, gql } from '@urql/vue'
import OpenBrowserList from './OpenBrowserList.vue'
import { OpenBrowserFragment, OpenBrowser_LaunchProjectDocument } from '../generated/graphql'

gql`
mutation OpenBrowser_clearTestingType {
  clearCurrentTestingType {
    currentProject {
      id
    }
    wizard {
      ...Wizard
    }
  }
}
`

gql`
fragment OpenBrowser on CurrentProject {
  id
  currentTestingType
  ...OpenBrowserList
}
`

gql`
mutation OpenBrowser_LaunchProject ($testingType: TestingTypeEnum!, $browserPath: String!)  {
  launchOpenProject
  # hideBrowserWindow
  setProjectPreferences(testingType: $testingType, browserPath: $browserPath) {
    currentProject {
      id
      title
    }
  }
}
`

const props = defineProps<{
  gql: OpenBrowserFragment
}>()

const launchOpenProject = useMutation(OpenBrowser_LaunchProjectDocument)

const backFn = () => {
  //
}

const launch = (browserPath?: string) => {
  const testingType = props.gql.currentTestingType

  if (browserPath && testingType) {
    launchOpenProject.executeMutation({
      browserPath,
      testingType,
    })
  }
}

</script>
