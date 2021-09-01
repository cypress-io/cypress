<template>
  <template v-if="wizard && app">
    <h1 class="text-3xl mt-12 text-center">{{ wizard.title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="wizard.description" />
    <div class="mx-5">
      <TestingTypeCards 
        v-if="wizard.step === 'welcome'"
        :gql="query" 
      />
      <EnvironmentSetup v-if="wizard.step === 'selectFramework'" :gql="wizard" />
      <InstallDependencies v-if="wizard.step === 'installDependencies'" :gql="wizard" />
      <ConfigFile v-if="wizard.step === 'createConfig'" :wizard="wizard" :app="app" />
      <OpenBrowser 
        v-if="wizard.step === 'setupComplete'" 
        :app="app"
      />
    </div>
  </template> 
</template>

<script lang="ts" setup>
import { computed } from "vue";
import TestingTypeCards from "./TestingTypeCards.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";
import { gql } from '@urql/core'
import type { 
  WizardFragment,
} from '../generated/graphql'

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
fragment WizardApp on App {
  isFirstOpen
  activeProject {
    hasSetupComponentTesting
    hasSetupE2ETesting
  }
  ...ProjectRoot
  ...TestingTypeCardsApp
  ...OpenBrowser
}

fragment WizardWizard on Wizard {
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

fragment Wizard on Query {
  app {
    ...WizardApp
  }
  wizard {
    ...WizardWizard
  }
}
`

const props = defineProps<{
  query: WizardFragment
}>()

const app = computed(() => props.query?.app)
const wizard = computed(() => props.query?.wizard)
</script>
