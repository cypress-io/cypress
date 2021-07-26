<template>
  <h1 class="text-3xl mt-12 text-center">{{ title }}</h1>
  <p class="text-center text-gray-400 my-2 mx-10" v-html="description" />
  <div class="mx-5">
    <TestingType
      v-if="true" 
      @testingTypeSet="testingTypeSet"
    />

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
import { useQuery, useResult } from "@vue/apollo-composable";

import { useStoreApp } from "../store/app";
import TestingType from "./TestingType.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";
import { gql } from '@apollo/client/core'
import { TestingTypeDocument, WizardDocument } from '../generated/graphql'

gql`
query Wizard {
  app {
    isFirstOpen
  }
}
`

gql`
query TestingType {
  openProject {
    testingType
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
    const { result: testingTypeResult, refetch } = useQuery(TestingTypeDocument)

    const testingTypeSet = () => {
      console.log('Refetch')
      refetch()
    }


    const testingType = useResult(testingTypeResult, null, data => data.openProject.testingType)

    watch(testingType, val => {
      console.log('Value is', val)
    })

    return { 
      steps, 
      title, 
      description, 
      testingTypeSet,
      testingType
    };
  },
});
</script>
