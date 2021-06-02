<template>
<div class="h-screen bg-white">
  <div class="h-60">
    <div class="flex justify-between p-2 bg-gray-900 text-white">
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
        <div>You chose {{ selectedTestingType }}</div>
        <select-framework v-if="selectedTestingType === 'component'" />
        <div v-else> e2e was chosen</div>
      </step>

      <step :stepNumber="3">
        <install-dependencies />
      </step>
    </step-container>
  </div>
  <div class="flex justify-center">
    <button 
      class="text-blue-500 m-5 px-4 py-2 rounded border-blue-500 border-1 border-inset"
      :class="currentStep > 1 ? undefined : 'invisible'" @click="goBack"
    >
      Previous Step
    </button>
    <button
      class="bg-blue-500 text-white m-5 px-4 py-2 rounded" 
      @click="goNext"
    >
      Next Step
    </button>
  </div>
  
</div>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw, ref } from 'vue'
import { testingTypes } from './types/shared'
import RunnerButton from './components/RunnerButton.vue'
import { Step, StepContainer } from './components/StepContainer'
import SelectRunner from './components/SelectRunner.vue'
import SelectFramework from './components/SelectFramework.vue'
import InstallDependencies from './components/InstallDependencies.vue'
import { useStore } from './store'

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
    const store = useStore()

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
      goBack,
      selectedTestingType: computed(() => store.getState().testingType)
    }
  }
})
</script>
