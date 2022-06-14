<template>
  <component
    :is="latestRun? Tooltip : 'div'"
    placement="top"
    :is-interactive="true"
    class="h-16px"
    :hide-delay="0"
    :show-group="props.gql?.id"
  >
    <component
      :is="latestRun? ExternalLink : 'div'"
      :href="latestRun?.url || '#'"
      :use-default-hocus="false"
    >
      <div
        class="flex justify-end items-center"
        data-cy="run-status-dots"
        tabindex="0"
      >
        <div
          v-for="(dot,i) in dotClasses"
          :key="i"
          class="ml-4px"
        >
          <i-cy-dot-solid_x4
            width="4"
            height="4"
            :class="dot"
            :data-cy="'run-status-dot-'+i"
          />
        </div>
        <div>
          <component
            :is="latestStatus.icon"
            width="16"
            height="16"
            :class="{'animate-spin': latestStatus.spin}"
            :data-cy="'run-status-dot-latest'"
            class="ml-4px"
          />
        </div>
      </div>
    </component>
    <template
      #popper
    >
      <ExternalLink
        v-if="latestRun"
        :href="latestRun.url ?? '#'"
        :use-default-hocus="false"
      >
        <SpecRunSummary
          :run="latestRun"
          :spec-file-no-extension="props.specFileName"
          :spec-file-extension="props.specFileExtension"
        />
      </ExternalLink>
    </template>
  </component>
</template>

<script setup lang="ts">

import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { RunStatusDotsFragment } from '../generated/graphql'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { computed } from 'vue'
import CancelledIcon from '~icons/cy/cancelled-solid_x16.svg'
import ErroredIcon from '~icons/cy/errored-solid_x16.svg'
import FailedIcon from '~icons/cy/failed-solid_x16.svg'
import PassedIcon from '~icons/cy/passed-solid_x16.svg'
import PlaceholderIcon from '~icons/cy/placeholder-solid_x16.svg'
import RunningIcon from '~icons/cy/running-outline_x16.svg'
import SpecRunSummary from './SpecRunSummary.vue'
import { gql } from '@urql/vue'

gql`
fragment RunStatusDots on RemoteFetchableCloudProjectSpecResult {
  id
  data {
    ... on CloudProjectSpecNotFound {
      retrievedAt
    }
    ... on CloudProjectSpec {
      id
      retrievedAt
      specRuns(first: 4, fromBranch: $fromBranch) {
        nodes {
          id
          runNumber
          testsFailed{
            min
            max
          }
          testsPassed{
            min
            max
          }
          testsPending{
            min
            max
          }
          testsSkipped{
            min
            max
          }
          createdAt
          groupCount
          specDuration{
            min
            max
          }
          status
          url
        }
      }
    }
  }
}
`

const props = defineProps<{
  gql: RunStatusDotsFragment | null
  specFileName: string
  specFileExtension: string
}>()

const runs = computed(() => {
  return props.gql?.data?.__typename === 'CloudProjectSpec' ? props.gql?.data?.specRuns?.nodes ?? [] : []
})

const dotClasses = computed(() => {
  const statuses = ['placeholder', 'placeholder', 'placeholder']

  if (runs.value && runs.value.length > 0) {
    // skip the 0th index as it represents the latest run and dotClasses
    // is meant to represent the 3 prior runs.
    for (let i = 1; i < Math.min(runs.value.length, 4); i++) {
      statuses[i - 1] = runs.value[i]?.status ?? ''
    }
  }

  return statuses.reverse().map((s) => {
    switch (s) {
      case 'PASSED':
        return 'icon-light-jade-400'
      case 'RUNNING':
        return 'icon-light-indigo-400'
      case 'FAILED':
        return 'icon-light-red-400'
      case 'ERRORED':
      case 'OVERLIMIT':
      case 'TIMEDOUT':
        return 'icon-light-orange-400'
      case 'NOTESTS':
        return 'icon-light-gray-400'
      case 'CANCELLED':
      default:
        return 'icon-light-gray-300'
    }
  })
})

const latestRun = computed(() => {
  if (runs.value == null || runs.value.length === 0 || runs.value[0] === null) {
    return null
  }

  return runs.value[0]
})

const latestStatus = computed(() => {
  const run = latestRun.value

  if (!run) {
    return { icon: PlaceholderIcon, spin: false }
  }

  switch (run.status) {
    case 'PASSED':
      return { icon: PassedIcon, spin: false }
    case 'RUNNING':
      return { icon: RunningIcon, spin: true }
    case 'FAILED':
      return { icon: FailedIcon, spin: false }
    case 'ERRORED':
    case 'OVERLIMIT':
    case 'TIMEDOUT':
      return { icon: ErroredIcon, spin: false }
    case 'NOTESTS':
    case 'CANCELLED':
      return { icon: CancelledIcon, spin: false }
    default:
      return { icon: PlaceholderIcon, spin: false }
  }
})

</script>

<style lang="scss">
.RunStatusDots_Tooltip {
  .v-popper__arrow-container {
    margin-left: 14px;
  }
}
</style>
