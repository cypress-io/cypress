<template>
  <div class="text-center">
    <h1 class="text-3xl mt-12">{{ app.title }}</h1>
    <p class="text-gray-400 my-2 w-180 mx-auto">
      {{ app.description }}
    </p>
    <div class="max-w-4xl mx-auto">
      <TestingType v-if="!app.steps.testingType" />

      <template v-else-if="config.testingType === 'component'">
        <EnvironmentSetup v-if="!app.steps.setup" />
        <InstallDependencies v-else-if="!app.steps.dependencies" />
        <ConfigFile v-else-if="!app.steps.configFile" />
        <OpenBrowser v-else />
      </template>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { useStoreApp } from "../store/app";
import { useStoreConfig } from "../store/config";
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
    const storeConfig = useStoreConfig();

    return { app: storeApp.getState(), config: storeConfig.getState() };
  },
});
</script>
