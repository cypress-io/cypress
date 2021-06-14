<template>
  <div class="h-150 max-w-200 mx-auto rounded-xl bg-white relative">
    <div>
      <div class="flex justify-between p-2 bg-gray-900 text-white">
        Cypress Dashboard

        <button>Log in</button>
      </div>
      <div class="flex flex-col justify-center h-120 p-2">
        <SelectWizard v-if="!currentStep" />
        <!-- Dynamically grabs a component that implements the current step's API -->
        <component v-else :is="currentStep.component" />
      </div>
    </div>

    <div class="text-right absolute bottom-2 right-2">
      <BaseButton outline v-show="currentStep" @click="goBack">
        Previous Step
      </BaseButton>

      <BaseButton
        :disabled="!selectedTestingType || !canGoNextStep"
        data-cy="previous"
        primary
        @click="goNext"
      >
        {{ nextStepText }}
      </BaseButton>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw, ref } from "vue";
import { testingTypes } from "./types/shared";
import RunnerButton from "./components/RunnerButton.vue";
import SelectWizard from "./components/SelectWizard.vue";
import { wizards } from "./wizards/wizards";
import { useStore } from "./store";
import BaseButton from "./components/BaseButton.vue";

export default defineComponent({
  name: "App",

  components: {
    RunnerButton,
    SelectWizard,
    BaseButton,
  },

  setup() {
    const store = useStore();

    const currentStepNumber = ref<number>(0);

    const selectedWizard = computed(() =>
      store.getState().testingType
        ? wizards[store.getState().testingType!]
        : undefined
    );

    const goNext = () => {
      if (
        !selectedWizard.value ||
        currentStepNumber.value === selectedWizard.value.steps.length
      ) {
        // we are done!
        // launch browser, or whatever
        return;
      }

      currentStepNumber.value += 1;
    };

    const goBack = () => {
      if (currentStepNumber.value > 0) {
        currentStepNumber.value -= 1;
      }
    };

    const lastStepOfWorkflow = computed(() => {
      return (
        selectedWizard.value &&
        selectedWizard.value.steps.length <= currentStepNumber.value
      );
    });

    const nextStepText = computed(() => {
      if (lastStepOfWorkflow.value) {
        return "Launch";
      }

      return "Next Step";
    });

    const currentStep = computed(() =>
      selectedWizard.value
        ? selectedWizard.value.steps[currentStepNumber.value - 1]
        : undefined
    );

    return {
      testingTypes: markRaw(testingTypes),
      selectedWizard,
      canGoNextStep: computed(() =>
        currentStep.value
          ? currentStep.value.canGoNextStep()
          : !!selectedWizard.value
      ),
      nextStepText,
      currentStep,
      goNext,
      goBack,
      selectedTestingType: computed(() => store.getState().testingType),
    };
  },
});
</script>
