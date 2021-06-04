<template>
  <div class="h-screen bg-white">
    <div>
      <div class="flex justify-between p-2 bg-gray-900 text-white">
        Cypress Dashboard

        <button>Log in</button>
      </div>

      <SelectWizard v-if="!currentStep" />
      <component v-else :is="currentStep.component" />
    </div>

    <div class="flex justify-center">
      <button 
        class="text-blue-500 m-5 px-4 py-2 rounded border-blue-500 border-1 border-inset"
        :class="{ 'invisible': !currentStep }" 
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
import { ipcBus } from './ipcBus'

export default defineComponent({
  name: 'App',

  components: {
    RunnerButton,
    SelectWizard,
  },

  setup() {
    const store = useStore()

    const currentStepNumber = ref<number>(0)

    const selectedWizard =  computed(() => 
      store.getState().testingType
        ? wizards[store.getState().testingType!]
        : undefined
    )

    const goNext = () => {
      ipcBus.send('get:package-manager', undefined)

      if (!selectedWizard.value || currentStepNumber.value === selectedWizard.value.steps.length) {
        // we are done!
        // launch browser, or whatever
        return
      }

      currentStepNumber.value += 1
    }

    const goBack = () => {
      if (currentStepNumber.value > 0) {
        currentStepNumber.value -= 1
      }
    }

    const lastStepOfWorkflow = computed(() => {
      return selectedWizard.value && 
        selectedWizard.value.steps.length <= currentStepNumber.value
    })

    const nextStepText = computed(() => {
      if (lastStepOfWorkflow.value) {
        return 'Launch'
      }

      return 'Next Step'
    })

    const currentStep = computed(() => selectedWizard.value ? selectedWizard.value.steps[currentStepNumber.value - 1] : undefined)

    return {
      testingTypes: markRaw(testingTypes),
      selectedWizard,
      canGoNextStep: computed(() => currentStep.value ? currentStep.value.canGoNextStep() : !!selectedWizard.value),
      nextStepText,
      currentStep,
      goNext,
      goBack,
      selectedTestingType: computed(() => store.getState().testingType)
    }
  }
})
</script>
