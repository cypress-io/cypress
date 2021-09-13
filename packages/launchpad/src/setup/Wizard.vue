<template>
  <template v-if="wizard && app">
    <h1 class="text-3xl pt-12 text-center">{{ wizard.title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="wizard.description" />
    <div class="mx-5">
      <TestingTypeCards 
        v-if="wizard.step === 'welcome'"
        :gql="data"
      />
      <EnvironmentSetup 
        v-if="wizard.step === 'selectFramework'" 
        :gql="wizard" 
      />
      <InstallDependencies 
        v-if="wizard.step === 'installDependencies'" 
        :gql="wizard" 
      />
      <ConfigFile 
        v-if="wizard.step === 'createConfig'" 
        :gql="data"
      />
      <OpenBrowser 
        v-if="wizard.step === 'setupComplete'" 
        :gql="data"
      />
    </div>
  </template> 
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
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
fragment Wizard on Query {
  ...TestingTypeCards
  app {
    isFirstOpen
    activeProject {
      id
      hasSetupE2ETesting
      hasSetupComponentTesting
    }
  }

  wizard {
    step
    title
    description
    testingType
    ...TestingType
    ...InstallDependencies
    ...EnvironmentSetup
  }
  ...ConfigFile
  ...OpenBrowser
}
`

const props = defineProps<{
  gql: WizardFragment
}>()

const app = computed(() => props.gql?.app)
const wizard = computed(() => props.gql?.wizard)
const data = computed(() => props.gql)
</script>
