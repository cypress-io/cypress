<template>
  <template v-if="!loading && wizard">
    <h1 class="text-3xl mt-12 text-center">{{ wizard.title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="wizard.description" />
    <div class="mx-5">
      <TestingType v-if="wizard.step === 'welcome'" :gql="wizard" />
      <template v-else-if="wizard.testingType === 'component'">
        <EnvironmentSetup v-if="wizard.step === 'selectFramework'" :gql="wizard" />
        <InstallDependencies v-else-if="wizard.step === 'installDependencies'" :gql="wizard" />
        <ConfigFile v-else-if="wizard.step === 'createConfig'" :gql="wizard" />
        <OpenBrowser v-else-if="wizard.step === 'setupComplete'" />
      </template>
      <template v-else>
        <WizardLayout>
          <div>Here be dragons</div>
        </WizardLayout>
      </template>
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent, watch, computed } from "vue";
import TestingType from "./TestingType.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";
import { gql } from '@urql/core'
import { WizardDocument } from '../generated/graphql'
import { useQuery } from "@urql/vue";

gql`
query Wizard {
  app {
    isFirstOpen
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

export default defineComponent({
  components: {
    TestingType,
    EnvironmentSetup,
    InstallDependencies,
    ConfigFile,
    OpenBrowser,
  },
  setup() {
    const result = useQuery({
      query: WizardDocument,
    })

    return { 
      loading: result.fetching, 
      wizard: computed(() => result.data.value?.wizard) };
  },
});
</script>
