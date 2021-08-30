<template>
  <template v-if="wizard && app">
    <Auth />
    <Button @click="launchCt">Launch CT in Chrome</Button>
    <Button @click="launchE2E">Launch E2E in Chrome</Button>
    <h1 class="text-3xl mt-12 text-center">{{ wizard.title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="wizard.description" />
    <div class="mx-5">
      <template v-if="wizard.step === 'welcome'">
        <TestingTypeCards 
          :gql="query" 
          @launchCt="launchCt"
          @launchE2E="launchE2E"
        />
      </template> 
      <template v-else-if="wizard.testingType === 'component'">
        <EnvironmentSetup v-if="wizard.step === 'selectFramework'" :gql="wizard" />
        <InstallDependencies v-else-if="wizard.step === 'installDependencies'" :gql="wizard" />
        <ConfigFile v-else-if="wizard.step === 'createConfig'" :wizard="wizard" :app="app" />
        <OpenBrowser v-else-if="wizard.step === 'setupComplete'" />
      </template>
      <template v-else>
        <WizardLayout :canNavigateForward="wizard.canNavigateForward">
          <div>Here be dragons</div>
        </WizardLayout>
      </template>
    </div>
  </template> 
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Auth from './Auth.vue'
import TestingTypeCards from "./TestingTypeCards.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";
import WizardLayout from './WizardLayout.vue'
import { gql } from '@urql/core'
import { 
  InitializeOpenProjectDocument,
  LaunchOpenProjectDocument,
  WizardFragment,
} from '../generated/graphql'
import { useMutation } from "@urql/vue";
import Button from '../components/button/Button.vue'

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

gql`
fragment Wizard on Query {
  app {
    ...TestingTypeCardsApp
    isFirstOpen
    activeProject {
      hasSetupComponentTesting
      hasSetupE2ETesting
    }
    ...ProjectRoot
  }
  wizard {
    step
    title
    ...TestingTypeCardsWizard
    description
    testingType
    ...TestingType
    ...ConfigFile
    ...InstallDependencies
    ...EnvironmentSetup
  }
}
`

const props = defineProps<{
  query: WizardFragment
}>()

const app = computed(() => props.query?.app)
const wizard = computed(() => props.query?.wizard)

const initializeOpenProject = useMutation(InitializeOpenProjectDocument)
const launchOpenProject = useMutation(LaunchOpenProjectDocument)

const launchCt = async () => {
  const r1 = await initializeOpenProject.executeMutation({ testingType: 'component' })
  console.log(r1.error)
  await launchOpenProject.executeMutation({ testingType: 'component' })
}

const launchE2E = async () => {
  await initializeOpenProject.executeMutation({ testingType: 'e2e' })
  await launchOpenProject.executeMutation({ testingType: 'e2e' })
}
</script>
