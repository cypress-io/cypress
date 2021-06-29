<template>
  <h2 class="text-xl text-left mb-4">
    Welcome! What kind of tests would you like to run?
  </h2>

  <div class="max-w-128 mx-auto my-0">
    <NewUserWelcome v-if="showNewUserFlow" @close="dismissNewUserWelcome" />
  </div>

  <div class="text-center">
    <RunnerButton
      v-for="testingType of testingTypes"
      :key="testingType"
      :testingType="testingType"
      :selected="selectedTestingType === testingType"
      @click="selectTestingType(testingType)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw, computed } from "vue";
import { useStore } from "../store";
import { TestingType, testingTypes } from "../types/shared";
import RunnerButton from "./RunnerButton.vue";
import NewUserWelcome from "./NewUserWelcome.vue";

export default defineComponent({
  components: {
    RunnerButton,
    NewUserWelcome,
  },

  setup() {
    const store = useStore();

    const selectTestingType = (testingType: TestingType) => {
      store.setTestingType(testingType);
    };

    const dismissNewUserWelcome = () => {
      store.setDismissedHelper(true);
    };

    return {
      testingTypes: markRaw(testingTypes),
      selectTestingType,
      showNewUserFlow: computed(
        () => store.getState().firstOpen && !store.getState().hasDismissedHelper
      ),
      selectedTestingType: computed(() => store.getState().testingType),
      dismissNewUserWelcome,
    };
  },
});
</script>