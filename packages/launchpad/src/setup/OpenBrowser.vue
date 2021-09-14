<template>
  <WizardLayout
    :canNavigateForward="false"
    :showNext="false"
    no-container
  >
    <template #="{ backFn }">
      <div class="text-center">
        <div v-if="query.fetching.value || !query.data.value">Loading browsers...</div>
        <template v-else>
          <OpenBrowserList
            v-model:variant="openBrowserVariant"
            :gql="query.data.value.app"
            @navigated-back="backFn"
            @launch="launch"
          />
        </template>
      </div>
    </template>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { useMutation, gql, useQuery } from "@urql/vue";
import OpenBrowserList from "./OpenBrowserList.vue"
import WizardLayout from "./WizardLayout.vue";
import { OpenBrowserDocument, LaunchOpenProjectDocument } from "../generated/graphql"
import { ref } from "vue"

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