<template>
  <div data-cy="result">
    {{ value }}
  </div>
</template>

<script lang="ts">
export type CopyOption = {
  id: string
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
  cohorts: props.copyOptions.map((option) => option.id),
  algorithm: props.algorithm,
}

const cohortSelected = useCohorts(cohortConfig).get()

const value = props.copyOptions.filter((option) => option.id === cohortSelected.id)[0].value

</script>
