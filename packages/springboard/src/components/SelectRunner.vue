<template>
  <h2 class="text-xl text-left my-4 mx-2">
    Welcome! What kind of tests would you like to run?
  </h2>

  <div class="text-center" >
    <RunnerButton 
      v-for="testingType of testingTypes"
      inputName="testingType"
      :testingType="testingType"
      :selected="state.testingType === testingType"
      @click="selectTestingType(testingType)"
    />
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