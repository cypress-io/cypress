<template>
  <div class="h-screen bg-white">
    <div class="h-60">
      <div class="flex justify-between p-2 bg-gray-900 text-white">
        Cypress Dashboard

        <button>Log in</button>
      </div>

      <SelectWizard v-if="currentStep === 0" />

      <div 
        v-if="selectedWizard"
        v-for="step in selectedWizard.steps" 
        :key="step.name"
      >
        <component 
          :is="step.component" 
          v-if="step.number === currentStep"
        />
      </div>
    </div>

    <div class="flex justify-center">
      <button 
        class="text-blue-500 m-5 px-4 py-2 rounded border-blue-500 border-1 border-inset"
        :class="{ invisible: currentStep === 0 }" 
        @click="goBack"
      >
        Previous Step
      </button>

      <button
        :disabled="!selectedTestingType"
        class="bg-blue-500 text-white m-5 px-4 py-2 rounded" 
        :class="{ 'opacity-50': !selectedTestingType }"
        @click="goNext"
      >
        {{ nextStepText }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw, ref } from 'vue'
import { testingTypes } from './types/shared'
import RunnerButton from './components/RunnerButton.vue'
import SelectWizard from './components/SelectWizard.vue'
import SelectFramework from './components/SelectFramework.vue'
import InstallDependencies from './components/InstallDependencies.vue'
import { wizards } from './wizards'
import { useStore } from './store'

export default defineComponent({
  name: 'App',

  components: {
    RunnerButton,
    SelectFramework,
    SelectWizard,
    InstallDependencies,
  },

  setup() {
    const store = useStore()

    const currentStep = ref<number>(0)

    const goBack = () => {
      currentStep.value -= 1
    }

    const selectedWizard =  computed(() => 
      store.getState().testingType
        ? wizards[store.getState().testingType!]
        : undefined
    )

    const goNext = () => {
      if (!selectedWizard.value || currentStep.value === selectedWizard.value.steps.length) {
        return
      }

      currentStep.value += 1
    }

    const lastStepOfWorkflow = computed(() => {
      return selectedWizard.value && 
        selectedWizard.value.steps.length <= currentStep.value
    })

    const nextStepText = computed(() => {
      if (lastStepOfWorkflow.value) {
        return 'Launch'
      }

      return 'Next Step'
    })

    return {
      lastStepOfWorkflow,
      testingTypes: markRaw(testingTypes),
      nextStepText,
      selectedWizard,
      currentStep,
      goNext,
      goBack,
      selectedTestingType: computed(() => store.getState().testingType)
    }
  }
})
</script>
