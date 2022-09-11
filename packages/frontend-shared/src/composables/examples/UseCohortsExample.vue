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
    return props.copyOptions.find((option) => option.cohort === cohortSelected.value)
  }

  return { value: '' }
})

</script>
