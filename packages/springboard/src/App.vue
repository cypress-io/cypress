<template>
  <div class="flex justify-between bg-gray-200">
    Cypress Dashboard

    <button>Log in</button>
  </div>

  <step-container
    :currentStep="currentStep"
  >
    <step :stepNumber="1">
      <select-runner />
    </step>

    <step :stepNumber="2">
      <select-framework />
    </step>

    <step :stepNumber="3">
      <install-dependencies />
    </step>
  </step-container>

  <button 
    v-if="currentStep > 1"
    @click="goBack"
  >
    Previous Step
  </button>

  <div class="flex justify-center">
    <button 
      @click="goNext"
    >
      Next Step
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw, ref } from 'vue'
import { testingTypes } from './types/shared'
import RunnerButton from './components/RunnerButton.vue'
import { Step, StepContainer } from './components/StepContainer'
import SelectRunner from './components/SelectRunner.vue'
import SelectFramework from './components/SelectFramework.vue'
import InstallDependencies from './components/InstallDependencies.vue'

export default defineComponent({
  name: 'App',

  components: {
    RunnerButton,
    SelectFramework,
    SelectRunner,
    InstallDependencies,
    StepContainer,
    Step
  },

  setup() {
    const currentStep = ref<number>(1)

    const goNext = () => {
      if (currentStep.value === 3) {
        // we are done!
        // launch browser, or whatever
        return
      }

      currentStep.value += 1

    }

    const goBack = () => {
      currentStep.value -= 1
    }

    return {
      testingTypes: markRaw(testingTypes),
      currentStep,
      goNext,
      goBack
    }
  }
})
</script>
