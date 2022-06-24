<template>
  <component
    :is="latestRun? Tooltip : 'div'"
    placement="top"
    :is-interactive="true"
    class="h-16px"
    :hide-delay="0"
    :show-group="props.gql?.id"
    :distance="7"
    popper-class="RunStatusDots_Tooltip"
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
            :is="latestDot.icon"
            width="16"
            height="16"
            :class="{'animate-spin': latestDot.spin}"
            :data-cy="'run-status-dot-latest'"
            :data-cy-run-status="latestDot.status"
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
import QueuedIcon from '~icons/cy/queued-solid_x16.svg'
import RunningIcon from '~icons/cy/running-outline_x16.svg'
import SpecRunSummary from './SpecRunSummary.vue'
import { gql } from '@urql/vue'

gql`
fragment RunStatusDots on RemoteFetchableCloudProjectSpecResult {
  id
  data {
    __typename
    ... on CloudProjectSpecNotFound {
      retrievedAt
      # We query for message even though we don't use it so GQL can discriminate these two types properly
      message
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
      case 'TIMEDOUT':
        return 'icon-light-orange-400'
      case 'UNCLAIMED':
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

const latestDot = computed(() => {
  const status = latestRun.value?.status

  switch (status) {
    case 'PASSED':
      return { icon: PassedIcon, spin: false, status }
    case 'RUNNING':
      return { icon: RunningIcon, spin: true, status }
    case 'UNCLAIMED':
      return { icon: QueuedIcon, spin: false, status }
    case 'FAILED':
      return { icon: FailedIcon, spin: false, status }
    case 'ERRORED':
    case 'TIMEDOUT':
      return { icon: ErroredIcon, spin: false, status }
    case 'NOTESTS':
    case 'CANCELLED':
      return { icon: CancelledIcon, spin: false, status }
    default:
      return { icon: PlaceholderIcon, spin: false, status: 'PLACEHOLDER' }
  }
})

</script>

<style lang="scss">
.RunStatusDots_Tooltip {
  .v-popper__arrow-container {
    margin-left: 13px;
  }
}
</style>
