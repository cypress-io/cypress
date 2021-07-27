<template>
  <h1 class="text-3xl mt-12 text-center">{{ title }}</h1>
  <p class="text-center text-gray-400 my-2 mx-10" v-html="description" />
  <div class="mx-5">
    <TestingType v-if="!steps.component && !steps.e2e" />

    <template v-else-if="steps.component">
      <EnvironmentSetup v-if="!steps.setup" />
      <InstallDependencies v-else-if="!steps.dependencies" />
      <ConfigFile v-else-if="!steps.configFile" />
      <OpenBrowser v-else />
    </template>

    <template v-else-if="steps.e2e">
      <div>Here be dragons</div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, watch } from "vue";
import { useStoreApp } from "../store/app";
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
    wizard {
      step
    }
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
    const storeApp = useStoreApp();

    const title = computed(() => storeApp.getState().title)
    const description = computed(() => storeApp.getState().description)
    const steps = computed(() => storeApp.getState().steps)

    const { onResult, result, loading } = useQuery(WizardDocument, {})

    onResult((result) => {
      console.log(result)
    })

    watch(result, value => {
      console.log(value)
    })

    return { steps, title, description, loading, result };
  },
});
</script>
