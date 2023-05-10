<template>
  <div>
    <component
      :is="latestRun? Tooltip : 'div'"
      v-if="isRunsLoaded"
      placement="top"
      :is-interactive="true"
      class="h-[16px]"
      :hide-delay="0"
      :show-group="props.gql?.id"
      :distance="7"
      popper-class="RunStatusDots_Tooltip"
    >
      <component
        :is="latestRun? ExternalLink : 'div'"
        :href="cloudUrl"
      >
        <div
          v-if="isRunsLoaded"
          class="flex justify-end items-center"
          data-cy="run-status-dots"
        >
          <div
            v-for="(dot,i) in dotClasses"
            :key="i"
            class="ml-[4px]"
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
              class="ml-[4px]"
            />
          </div>
          <span
            v-if="latestRun"
            class="sr-only"
          >{{ props.specFileName }}{{ props.specFileExtension }} test results</span>
        </div>
      </component>
      <template
        #popper
      >
        <ExternalLink
          v-if="latestRun"
          :href="cloudUrl"
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
    <div
      v-if="!isRunsLoaded"
      data-cy="run-status-empty"
      class="text-gray-400"
    >
      --
    </div>
  </div>
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
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

// cloudProjectSpec.specRuns was marked deprecated in the cloud in favor of a new
// field. When the work is completed to use that field, remove this eslist-disable comment
/* eslint-disable graphql/no-deprecated-fields */
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
          basename
          path
          extension
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

const isRunsLoaded = computed(() => {
  return !!props.gql?.data
})

const dotClasses = computed(() => {
  const statuses = ['placeholder', 'placeholder', 'placeholder']

  // If there's more than one run (the latest) we can attempt to determine the status of previous runs
  if (runs.value && runs.value.length > 1) {
    // Loop thru runs starting @ index 1 (most recent prior run) and continue up to the 3rd prior run if available (index 4)
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
      case 'NOTESTS':
        return 'icon-light-gray-400'
      case 'CANCELLED':
      case 'UNCLAIMED':
      default:
        return 'icon-light-gray-300'
    }
  })
})

const latestRun = computed(() => {
  return runs.value?.[0] ?? null
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

const cloudUrl = computed(() => {
  if (latestRun.value?.url) {
    return getUrlWithParams({
      url: latestRun.value.url,
      params: {
        utm_medium: 'Specs Latest Runs Dots',
        utm_campaign: latestDot.value.status,
      },
    })
  }

  return '#'
})

</script>

<style lang="scss">
.RunStatusDots_Tooltip {
  .v-popper__arrow-container {
    margin-left: 14px;
  }
}
</style>
