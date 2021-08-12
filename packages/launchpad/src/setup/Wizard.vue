<template>
  <template v-if="!loading && wizard">
    <Auth :gql="viewer" />
    <h1 class="text-3xl mt-12 text-center">{{ wizard.title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="wizard.description" />
    <div class="mx-5">
      <TestingType v-if="wizard.step === 'welcome'" :gql="wizard" />
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
import TestingType from "./TestingType.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";
import WizardLayout from './WizardLayout.vue'
import { gql } from '@urql/core'
import { RootDocument } from '../generated/graphql'
import { useQuery } from "@urql/vue";

gql`
query Root {
  app {
    isFirstOpen
    ...ProjectRoot
  }
  viewer {
    ...Authenticate
  }
  wizard {
    step
    title
    description
    testingType
    ...TestingType
    ...ConfigFile
    ...InstallDependencies
    ...EnvironmentSetup
  }
}
`
const result = useQuery({ query: RootDocument })

const loading = result.fetching
const wizard = computed(() => result.data.value?.wizard)
const app = computed(() => result.data.value?.app!)
const viewer = computed(() => result.data.value?.viewer)
</script>
