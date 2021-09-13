<template>
  <WizardLayout :canNavigateForward="false" :showNext="false">
    <div v-if="query.fetching.value">
      Loading browsers...
    </div>
    <template v-else>
      <img src="../images/success.svg" class="mx-auto my-10"/>
      <div class="flex justify-center">
        <h1 class="text-3xl">TODO: launch in selected browser. Right now they all launch chrome.</h1>
        <Button
          v-for="browser of query.data?.value?.app.browsers"
          :key="browser.version"
          class="m-2"
          @click="launch"
        >
          {{ `${browser.displayName} v${browser.version}.x` }}
        </Button>
      </div>
    </template>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { useMutation, gql, useQuery } from "@urql/vue";
import Button from "../components/button/Button.vue"
import WizardLayout from "./WizardLayout.vue";
import { OpenBrowserDocument, LaunchOpenProjectDocument } from "../generated/graphql"

gql`
query OpenBrowser {
  app {
    browsers {
      displayName
      version
      majorVersion
      name
    }
  }
}
`

const query = useQuery({ query: OpenBrowserDocument })

// gql`
// mutation InitializeOpenProject ($testingType: TestingTypeEnum!) {
//   initializeOpenProject (testingType: $testingType) {
//     projects {
//       __typename # don't really care about result at this point
//     }
//   }
// }
// `

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
