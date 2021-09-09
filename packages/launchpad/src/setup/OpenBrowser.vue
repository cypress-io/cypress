<template>
  <WizardLayout :canNavigateForward="false" :showNext="false">
    <img src="../images/success.svg" class="mx-auto my-10"/>
    <div class="flex justify-center">
      <h1 class="text-3xl">TODO: launch in selected browser. Right now they all launch chrome.</h1>
      <Button
        v-for="browser of props.app.browsers"
        :key="browser.version"
        class="m-2"
        @click="launch"
      >
        {{ `${browser.displayName} v${browser.version}.x` }}
      </Button>
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { gql } from "@urql/core"
import Button from "../components/button/Button.vue"
import WizardLayout from "./WizardLayout.vue";
import { InitializeOpenProjectDocument, LaunchOpenProjectDocument, OpenBrowserFragment } from "../generated/graphql"
import { useMutation } from "@urql/vue";

gql`
fragment OpenBrowser on Query {
  app {
    browsers {
      displayName
      version
      majorVersion
      name
    }
  }
  wizard {
    testingType
  }
}
`

gql`
mutation InitializeOpenProject ($testingType: TestingTypeEnum!) {
  initializeOpenProject (testingType: $testingType) {
    projects {
      __typename # don't really care about result at this point
    }
  }
}
`

gql`
mutation LaunchOpenProject ($testingType: TestingTypeEnum!) {
  launchOpenProject (testingType: $testingType) {
    projects {
      __typename # don't really care about result at this point
    }
  }
}
`


const initializeOpenProject = useMutation(InitializeOpenProjectDocument)
const launchOpenProject = useMutation(LaunchOpenProjectDocument)

const props = defineProps<{
  gql: OpenBrowserFragment
}>()

const launch = async () => {
  if (!props.gql.wizard?.testingType) {
    return
  }
  
  await initializeOpenProject.executeMutation({ testingType: props.gql.wizard.testingType })
  await launchOpenProject.executeMutation({ testingType: props.gql.wizard.testingType })
}
</script>
