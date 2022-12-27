<template>
  <div data-cy="result">
    {{ cohortChoice?.value }}
  </div>
</template>

<script lang="ts">
export type CopyOption = {
  cohort: string
  value: string
}
</script>

<script setup lang="ts">
import { CohortConfig, useCohorts } from '../../gql-components/composables/useCohorts'

const props = defineProps<{
  weights?: number[]
  copyOptions: CopyOption[]
}>()

const cohortConfig: CohortConfig = {
  name: 'login',
  options: props.copyOptions,
  weights: props.weights,
}

const cohortChoice = useCohorts().getCohort(cohortConfig)

</script>
