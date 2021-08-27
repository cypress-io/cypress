<template>
  <template v-if="!loading && wizard">
    <Auth />
    <Button @click="launchCt">Launch CT in Chrome</Button>
    <Button @click="launchE2E">Launch E2E in Chrome</Button>
    <h1 class="text-3xl mt-12 text-center">{{ wizard.title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="wizard.description" />
    <div class="mx-5">
      <template v-if="wizard.step === 'welcome'">
        <div class="max-w-4xl mx-auto text-center">
          <template
            v-for="testingType of wizard.testingTypes"
            :key="testingType.id"
          >

            <template v-if="testingType.id === 'component'">
              <div v-if="app.activeProject?.hasSetupComponentTesting">
                You already set up component testing!
              </div>
              <TestingTypeCard v-else :testingType="testingType" />
            </template>

            <template v-if="testingType.id === 'e2e'">
              <div v-if="app.activeProject?.hasSetupE2ETesting">
                You already set up e2e testing!
              </div>
              <TestingTypeCard v-else :testingType="testingType" />
            </template>

          </template>
        </div>
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
import TestingTypeCard from "./TestingTypeCard.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";
import WizardLayout from './WizardLayout.vue'
import { gql } from '@urql/core'
import { 
  WizardQueryDocument, 
  InitializeOpenProjectDocument,
  LaunchOpenProjectDocument
} from '../generated/graphql'
import { useMutation, useQuery } from "@urql/vue";
import Button from '../components/button/Button.vue'

gql`
query WizardQuery {
  app {
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
    description
    testingType
    testingTypes {
      ...TestingTypeCard
    }
    ...TestingType
    ...ConfigFile
    ...InstallDependencies
    ...EnvironmentSetup
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

const result = useQuery({ query: WizardQueryDocument })

const loading = result.fetching
const wizard = computed(() => result.data.value?.wizard)
const app = computed(() => result.data.value?.app!)

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
