<template>
  <div class="flex h-6 text-gray-500 border border-gray-200 rounded">
    <div class="flex items-center px-2">
      <i-cy-status-flaky_x12 class="mr-1 h-12px w-12px icon-dark-gray-400" />
      0
      <!--
				TODO: Is flake even exposed via the API?
				{{props.gql.totalFlake}}
				-->
    </div>
    <div class="flex items-center px-2">
      <i-cy-status-skipped_x12 class="mr-1 h-12px w-12px icon-dark-gray-400" />
      {{ props.gql.totalSkipped }}
    </div>
    <div class="flex items-center px-2">
      <i-cy-status-pending_x12 class="mr-1 h-12px w-12px icon-dark-gray-400 icon-light-white" />
      {{ props.gql.totalPending }}
    </div>
    <div class="flex items-center px-2">
      <i-cy-status-passed_x12 class="mr-1 h-12px w-12px icon-dark-jade-400" />
      {{ props.gql.totalPassed }}
    </div>
    <div class="flex items-center px-2">
      <i-cy-status-failed_x12 class="mr-1 h-12px w-12px icon-dark-red-400" />
      {{ props.gql.totalFailed }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RunResultsFragment } from '../generated/graphql'
import { gql } from '@urql/core'

gql`
fragment RunResults on CloudRun {
	id
	totalPassed
	totalFailed
	totalPending
	totalSkipped
	totalDuration
}
`

const props = defineProps<{
	gql: RunResultsFragment
}>()
</script>
