<template>
  <h2 class="text-xl text-left mb-4">
    Welcome! What kind of tests would you like to run?
  </h2>

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
import { defineComponent, markRaw, computed } from 'vue'
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
      selectedTestingType: computed(() => store.getState().testingType)
    }
  }
})
</script>