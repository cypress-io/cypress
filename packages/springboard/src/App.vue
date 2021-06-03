<template>
  <div class="h-screen bg-white">
    <div>
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
          @setNextStepStatus="setNextStepStatus"
        />
      </div>
    </div>

    <div class="flex justify-center">
      <button 
        class="text-blue-500 m-5 px-4 py-2 rounded border-blue-500 border-1 border-inset"
        :class="{ 'invisible': currentStep === 0 }" 
        @click="goBack"
      >
        Previous Step
      </button>

      <button
        :disabled="!selectedTestingType || !canGoNextStep"
        data-cy="previous"
        class="bg-blue-500 text-white m-5 px-4 py-2 rounded" 
        :class="{ 'opacity-50': !selectedTestingType || !canGoNextStep }"
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
import { wizards } from './wizards/wizards'
import { useStore } from './store'

export default defineComponent({
  name: 'App',

  components: {
    RunnerButton,
    SelectWizard,
  },

  setup() {
    const store = useStore()

    const currentStep = ref<number>(0)

    const selectedWizard =  computed(() => 
      store.getState().testingType
        ? wizards[store.getState().testingType!]
        : undefined
    )

    const goNext = () => {
      if (!selectedWizard.value || currentStep.value === selectedWizard.value.steps.length) {
        // we are done!
        // launch browser, or whatever
        return
      }

      currentStep.value += 1
    }

    const goBack = () => {
      if (currentStep.value > 0) {
        currentStep.value -= 1
      }
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

    const canGoNextStep = ref(true)

    const setNextStepStatus = (val: boolean) => {
      canGoNextStep.value = val
    }

    return {
      testingTypes: markRaw(testingTypes),
      selectedWizard,
      setNextStepStatus,
      canGoNextStep,
      nextStepText,
      currentStep,
      goNext,
      goBack,
      selectedTestingType: computed(() => store.getState().testingType)
    }
  }
})
</script>
