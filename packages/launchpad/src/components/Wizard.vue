<template>
  <h1 class="text-3xl mt-12">{{ store.title }}</h1>
  <p class="text-gray-400 my-2 w-180 mx-auto">
    {{ store.description }}
  </p>
  <div class="max-w-4xl mx-auto">
    <TestingType v-if="!store.testingType" />

    <template v-else-if="store.testingType === 'component'">
      <EnvironmentSetup v-if="!store.component?.complete" />
      <InstallDependencies v-else />
    </template>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "../store";
import TestingType from "./1-TestingType.vue";
import EnvironmentSetup from "./2-EnvironmentSetup.vue";
import InstallDependencies from "./3-InstallDependencies.vue";

export default defineComponent({
  components: {
    TestingType,
    EnvironmentSetup,
    InstallDependencies,
  },
  setup() {
    const store = useStore();

    return { store: store.getState() };
  },
});
</script>
