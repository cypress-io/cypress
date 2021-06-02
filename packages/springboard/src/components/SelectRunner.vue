<template>
  <div class="flex justify-center flex-col items-center">
    <h2>
      Welcome! What kind of tests would you like to run?
    </h2>

    <div>
      <RunnerButton 
        v-for="testingType of testingTypes"
        inputName="testingType"
        :testingType="testingType"
        :selected="state.testingType === testingType"
        @click="selectTestingType(testingType)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue'
import { useStore } from '../store'
import { TestingType, testingTypes } from '../types/shared'
import RunnerButton from './RunnerButton.vue'

export default defineComponent({
  components: {
    RunnerButton
  },

  setup() {
    const store = useStore()

    const selectTestingType = (testingType: TestingType) => {
      store.setTestingType(testingType)
    }

    return {
      testingTypes: markRaw(testingTypes),
      selectTestingType,
      state: store.getState()
    }
  }
})
</script>