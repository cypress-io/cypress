<template>
  <div data-cy="result">
    {{ cohortChoice.value }}
  </div>
</template>

<script lang="ts">
export type CopyOption = {
  cohort: string
  value: string
}
</script>

<script setup lang="ts">
import type { WeightedAlgorithm } from '../../utils/weightedChoice'
import { CohortConfig, useCohorts } from '../useCohorts'
import { computed } from 'vue'

const props = defineProps<{
  algorithm?: WeightedAlgorithm
  copyOptions: CopyOption[]
}>()

const cohortConfig: CohortConfig = {
  name: 'login',
  cohorts: props.copyOptions.map((option) => option.cohort),
  algorithm: props.algorithm,
}

const cohortSelected = useCohorts(cohortConfig)

const cohortChoice = computed(() => {
  if (cohortSelected.value) {
    return props.copyOptions.filter((option) => option.cohort === cohortSelected.value)[0]
  }

  return { value: '' }
})

//http://localhost:5173/__/#/specs/runner?file=src/composables/examples/UseCohortsExample.cy.tsx

</script>
