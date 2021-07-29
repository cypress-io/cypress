<template>
  <template v-if="!loading && wizard">
    <h1 class="text-3xl mt-12 text-center">{{ wizard.title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="wizard.description" />
    <div class="mx-5">
      <TestingType v-if="wizard.step === 'welcome'" :gql="wizard" />
      <template v-else-if="wizard.testingType === 'component'">
        <EnvironmentSetup v-if="wizard.step === 'selectFramework'" :gql="wizard" />
        <InstallDependencies v-else-if="wizard.step === 'installDependencies'" :gql="wizard" />
        <ConfigFile v-else-if="wizard.step === 'createConfig'" />
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
import { defineComponent, watch } from "vue";
import TestingType from "./TestingType.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";
import { gql } from '@apollo/client/core'
import { WizardDocument } from '../generated/graphql'
import { useQuery, useResult } from "@vue/apollo-composable";

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

    // the `?` is not really needed since vue-apollo will automatically
    // swallow an errors: https://v4.apollo.vuejs.org/guide-composable/query.html#result-picking
    // but TS complains, so it's good to have it.
    const wizard = useResult(result, null, data => data?.wizard)

    return { loading, result, wizard };
  },
});
</script>
