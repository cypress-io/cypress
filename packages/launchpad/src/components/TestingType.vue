<template>
  <button
    :key="type.id"
    v-for="type in testingTypes"
    class="h-100 w-2/5 border border-gray-200 m-5 p-9 rounded"
    @click="selectTestingType(type.id)"
  >
    <img
      :src="type.icon"
      class="w-32 h-32 mb-10 mt-5 mx-auto"
    />
    <p class="text-indigo-700">{{ type.name }}</p>
    <p class="text-gray-400 text-sm">{{ type.description }}</p>
  </button>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { TestingType, testingTypes } from "../utils/testingTypes";
import { useStoreConfig } from "../store/config";
import { useStoreApp } from "../store/app";

export default defineComponent({
  setup() {
    const storeApp = useStoreApp();
    const storeConfig = useStoreConfig();

    onMounted(() => {
      storeApp.setMeta({
        title: "Welcome to Cypress",
        description:
          "Before we get started with testing your project, please confirm which method of testing you would like to use for the initial tests that you’ll be writing.",
      });
    });

    const selectTestingType = (testingType: TestingType) => {
      storeConfig.setTestingType(testingType);
    };

    return { testingTypes, selectTestingType };
  },
});
</script>
