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
import { InitializeOpenProjectDocument, LaunchOpenProjectDocument, OpenBrowserWizardFragment, OpenBrowserAppFragment } from "../generated/graphql"
import { useMutation } from "@urql/vue";

gql`
fragment OpenBrowserApp on App {
  browsers {
    displayName
    version
    majorVersion
    name
  }
}
`

gql`
fragment OpenBrowserWizard on Wizard {
  testingType
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
  app: OpenBrowserAppFragment
  wizard: OpenBrowserWizardFragment 
}>()

const launch = async () => {
  if (!props.wizard.testingType) {
    return
  }
  
  await initializeOpenProject.executeMutation({ testingType: props.wizard.testingType })
  await launchOpenProject.executeMutation({ testingType: props.wizard.testingType })
}
</script>
