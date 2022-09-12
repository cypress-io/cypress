<template>
  <div data-cy="result">
    {{ cohortChoice }}
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

const props = defineProps<{
  algorithm?: WeightedAlgorithm
  copyOptions: CopyOption[]
}>()

const cohortConfig: CohortConfig = {
  name: 'login',
  options: props.copyOptions,
  algorithm: props.algorithm,
}

const cohortChoice = useCohorts(cohortConfig)

</script>
