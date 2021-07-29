<template>
  <template v-if="!loading && result.wizard">
    <h1 class="text-3xl mt-12 text-center">{{ result.wizard.title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="result.wizard.description" />
    <div class="mx-5">
      <TestingType v-if="result.wizard.step === 'welcome'" :gql="result.wizard" />
      <template v-else-if="result?.wizard.testingType === 'component'">
        <EnvironmentSetup v-if="result.wizard.step === 'selectFramework'" :gql="result.wizard" />
        <InstallDependencies v-else-if="result.wizard.step === 'installDependencies'" :gql="result.wizard" />
        <ConfigFile v-else-if="result.wizard.step === 'createConfig'" />
        <OpenBrowser v-else-if="result.wizard.step === 'setupComplete'" />
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
import { defineComponent, watch } from "vue";
import TestingType from "./TestingType.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";
import { gql } from '@apollo/client/core'
import { WizardDocument } from '../generated/graphql'
import { useQuery } from "@vue/apollo-composable";

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
    const { onResult, result, loading } = useQuery(WizardDocument, {})

    onResult((result) => {
      console.log(result)
    })

    watch(result, value => {
      console.log(value)
    })

    return { loading, result };
  },
});
</script>
