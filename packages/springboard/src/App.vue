<template>
  <div>Welcome to the app!</div>
  <runner-button 
    v-for="testingType of testingTypes"
    :testing-type="testingType"
  />
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue'
import { testingTypes } from '../src/types/shared'
import RunnerButton from '../src/components/RunnerButton.vue'

export default defineComponent({
  name: 'App',

  components: {
    RunnerButton
  },

  setup() {
    return {
      testingTypes: markRaw(testingTypes)
    }
  }
})
</script>
