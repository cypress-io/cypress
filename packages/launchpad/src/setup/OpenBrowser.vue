<template>
  <WizardLayout :canNavigateForward="false" :showNext="false">
    <div v-if="query.fetching.value || !query.data.value">
      Loading browsers...
    </div>
    <template v-else>
      <img src="../images/success.svg" class="mx-auto my-10"/>
      <div class="flex justify-center">
        <h1 class="text-3xl">TODO: launch in selected browser. Right now they all launch chrome.</h1>
        <OpenBrowserList :gql="query.data.value.app" />
      </div>
    </template>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { useMutation, gql, useQuery } from "@urql/vue";
import OpenBrowserList from "./OpenBrowserList.vue"
import WizardLayout from "./WizardLayout.vue";
import { OpenBrowserDocument, LaunchOpenProjectDocument } from "../generated/graphql"

gql`
query OpenBrowser {
  app {
    ...OpenBrowserList
  }
}
`

const query = useQuery({ query: OpenBrowserDocument })

gql`
mutation LaunchOpenProject  {
  launchOpenProject {
    projects {
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
