<template>
  <OpenBrowserList
    v-if="props.gql.browsers"
    :gql="props.gql"
    @navigated-back="backFn"
    @launch="launch"
  />
  <Spinner v-else />
</template>

<script lang="ts" setup>
import { useMutation, gql } from '@urql/vue'
import Spinner from '@packages/frontend-shared/src/components/Spinner.vue'
import OpenBrowserList from './OpenBrowserList.vue'
import { OpenBrowserFragment, OpenBrowser_ClearTestingTypeDocument, OpenBrowser_LaunchProjectDocument } from '../generated/graphql'

gql`
mutation OpenBrowser_clearTestingType {
  clearCurrentTestingType {
    currentProject {
      id
      currentTestingType
      browsers {
        id
      }
    }
  }
}
`

gql`
fragment OpenBrowser on CurrentProject {
  id
  currentTestingType
  ...OpenBrowserList
  browsers {
    id
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

const props = defineProps<{
  gql: OpenBrowserFragment
}>()

const launchOpenProject = useMutation(OpenBrowser_LaunchProjectDocument)
const clearTestingType = useMutation(OpenBrowser_ClearTestingTypeDocument)

const backFn = () => {
  clearTestingType.executeMutation({})
}

const launch = (browserPath?: string) => {
  const testingType = props.gql.currentTestingType

  if (browserPath !== undefined && testingType) {
    launchOpenProject.executeMutation({
      browserPath,
      testingType,
    })
  }
}

</script>
