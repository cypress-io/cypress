<template>
  <h1 class="text-3xl mt-12 text-center">{{ app.title }}</h1>
  <p class="text-center text-gray-400 my-2 mx-10" v-html="app.description" />
  <div class="mx-10">
    <TestingType v-if="!app.steps.testingType" />

    <template v-else-if="app.testingType === 'component'">
      <EnvironmentSetup v-if="!app.steps.setup" />
      <InstallDependencies v-else-if="!app.steps.dependencies" />
      <ConfigFile v-else-if="!app.steps.configFile" />
      <OpenBrowser v-else />
    </template>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { useStoreApp } from "../store/app";
import TestingType from "./TestingType.vue";
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import OpenBrowser from "./OpenBrowser.vue";

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

    return { app: storeApp.getState() };
  },
});
</script>
