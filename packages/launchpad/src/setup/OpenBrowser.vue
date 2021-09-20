<template>
  <WizardLayout no-container :canNavigateForward="false" :showNext="false" #={backFn}>
    <div v-if="!query.data.value">
      Loading browsers...
    </div>
    <OpenBrowserList
      v-else
      variant=""
      :gql="query.data.value"
      @navigated-back="backFn"
      @launch="launch"
    />
  </WizardLayout>
</template>

<script lang="ts" setup>
import { useMutation, gql, useQuery } from "@urql/vue";
import OpenBrowserList from "./OpenBrowserList.vue"
import WizardLayout from "./WizardLayout.vue";
import { OpenBrowserDocument, LaunchOpenProjectDocument } from "../generated/graphql"

gql`
query OpenBrowser {
  ...OpenBrowserList
}
`

const query = useQuery({ query: OpenBrowserDocument })

gql`
mutation LaunchOpenProject  {
  launchOpenProject {
    projects {
      id
      __typename # don't really care about result at this point
    }
  }
}
`

const launchOpenProject = useMutation(LaunchOpenProjectDocument)

const launch = () => {
  launchOpenProject.executeMutation({})
}

</script>