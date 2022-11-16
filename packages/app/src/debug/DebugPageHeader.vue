<template>
  <div
    data-cy="debug"
    class="flex flex-col pb-24px gap-16px"
  >
    <div
      :data-cy="`debug-header-${run.id}`"
      class="grid px-24px w-full overflow-hidden flex items-center border gap-y-2 py-24px"
    >
      <ul
        :data-cy="'header-top'"
        class="flex self-stretch items-center gap-x-2 flex-row whitespace-nowrap"
      >
        <li class="font-medium text-lg text-gray-900">
          <span class="sr-only">Test Name:</span> {{ test.name }}
        </li>
        <div class="border rounded border-gray-100 items-center text-sm h-6">
          <span class="font-medium text-gray-700 border-r-1px px-2 mx-px">
            Run #468
          </span>
          <span class="font-normal text-orange-500 px-2 mx-px">
            You are 2 commits ahead
          </span>
        </div>
        <li class="-mt-8px text-lg text-gray-400">
          .
        </li>
        <li class="font-normal text-sm text-indigo-500">
          <span class="sr-only">Dashboard Link:</span> View in the dashboard
        </li>
      </ul>
      <ul
        :data-cy="'metadata'"
        class="flex flex-wrap gap-x-2 items-center"
      >
        <ResultCounts
          :total-passed="1"
          :total-failed="7"
          :total-skipped="6"
          :total-pending="6"
        />
      </ul>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import ResultCounts from '@packages/frontend-shared/src/components/ResultCounts.vue'
// import type { RunResultsFragment } from '../generated/graphql'
import { gql } from '@urql/core'

gql`
fragment RunResults on CloudRun {
  id
  totalPassed
  totalFailed
  totalPending
  totalSkipped
  totalFlakyTests
}
`
// const props = defineProps<{
//   gql: RunResultsFragment
// }>()

const run = computed(() => {
  return ({ id: 1, url: 'something.cypress.com' })
})

const test = computed(() => {
  return ({ name: 'Adding a hover state to the button component' })
})

</script>
<style scoped>

</style>
