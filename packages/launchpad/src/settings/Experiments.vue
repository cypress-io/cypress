<template>
  <div class="
      mx-auto
      border-1 border-gray-200
      rounded
      grid
      gap-0
      align-center
      px-16px">
    <ExperimentRow
      v-for="experiment in experiments"
      class="border-t-1 first:border-0 py-20px"
      :key="experiment.key"
      :experiment="experiment"/>
      
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ExperimentRow from './ExperimentRow.vue'
import { experiments } from './projectSettings'

export default defineComponent({
  components: { ExperimentRow },
  setup() {
    return {
      experiments
    }
  },
})
</script>
