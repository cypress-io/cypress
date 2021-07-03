<template>
  <button
    :key="type.id"
    v-for="type in testingTypes"
    class="h-100 w-2/5 border border-gray-200 m-5 p-9 rounded"
    @click="selectTestingType(type.id)"
  >
    <img
      :src="logos[`../assets/testingTypes/${type.icon}.svg`]?.default"
      class="w-32 h-32 mb-10 mt-5 mx-auto"
    />
    <p class="text-indigo-700">{{ type.name }}</p>
    <p class="text-gray-400 text-sm">{{ type.description }}</p>
  </button>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { TestingType } from "../utils/testingTypes";
import { useStore } from "../store";

const logos = import.meta.globEager("../assets/testingTypes/*.svg");
export default defineComponent({
  setup() {
    const store = useStore();

    onMounted(() => {
      store.setMeta({
        title: "Welcome to Cypress",
        description:
          "Before we get started with testing your project, please confirm which method of testing you would like to use for the initial tests that you’ll be writing.",
      });
    });

    const selectTestingType = (testingType: TestingType) => {
      store.setTestingType(testingType);
    };

    const testingTypes: Array<{
      name: string;
      icon: string;
      description: string;
      id: TestingType;
    }> = [
      {
        name: "Component Testing",
        icon: "component",
        description:
          "Aenean lacinia bibendum nulla sed consectetur. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean lacinia bibendum nulla sed consectetur.",
        id: "component",
      },
      {
        name: "E2E Testing",
        icon: "e2e",
        description:
          "Aenean lacinia bibendum nulla sed consectetur. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean lacinia bibendum nulla sed consectetur.",
        id: "e2e",
      },
    ];
    return { testingTypes, selectTestingType, logos };
  },
});
</script>
