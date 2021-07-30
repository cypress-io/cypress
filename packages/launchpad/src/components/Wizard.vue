<template>
  <div v-if="!wizard.data">
    LOADING
  </div>

  <div v-else>
    <h1 class="text-3xl mt-12 text-center">{{ title }}</h1>
    <p class="text-center text-gray-400 my-2 mx-10" v-html="description" />
    <div class="mx-5">
      <TestingType v-if="wizard.data?.value?.wizard?.step === 'welcome'" />
      <div v-if="wizard.data?.value?.wizard?.step === 'welcome'">OK</div>
      <div v-else>{{ wizard.data?.value?.wizard?.step }}</div>

      <template v-else-if="wizard.data?.value?.wizard?.testingType === 'component'">
        <EnvironmentSetup v-if="wizard.data?.value?.wizard?.step === 'selectFramework'" />
        <InstallDependencies v-else-if="wizard.data?.value?.wizard?.step === 'installDependencies'" />
      </template>

      <template v-else-if="wizard.data?.value?.wizard?.testingType === 'e2e'">
        <div>Here be dragons</div>
      </template>
    </div>
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
import { useQuery as useUrqlQuery } from "@urql/vue";

gql`
query Wizard {
  app {
    isFirstOpen
  }
  wizard {
    step
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
    const wizard = useUrqlQuery({
      query: WizardDocument
    })

    watch(wizard.data, result => {
      console.log('urql!', result?.wizard?.step)
    }, { immediate: true })

    const storeApp = useStoreApp();

    const title = computed(() => storeApp.getState().title)
    const description = computed(() => storeApp.getState().description)

    return { 
      title, 
      description, 
      wizard: wizard 
    };
  },
});
</script>
