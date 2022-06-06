<template>
  <component
    :is="latestRun? ExternalLink : 'div'"
    v-if="props.isProjectDisconnected || props.gql.cloudSpec?.status === 'FETCHED' || props.gql.cloudSpec?.status === 'ERRORED'"
    :href="latestRun?.url ?? '#'"
    :use-default-hocus="false"
  >
    <component
      :is="latestRun? Tooltip : 'div'"
      placement="top"
      :is-interactive="latestRun ? true: false"
    >
      <div
        class="flex justify-end"
        data-cy="run-status-dots"
        tabindex="0"
      >
        <ol
          class="flex list-none h-16px mt-0 mb-0 pl-0 inline-block"
        >
          <li
            v-for="(dot,i) in dotClasses"
            :key="i"
            class="mt-6px ml-4px inline-block"
          >
            <i-cy-dot-solid_x4
              width="4"
              height="4"
              :class="dot"
              :data-cy="'run-status-dot-'+i"
            />
          </li>
          <li class="ml-4px inline-block self-start">
            <component
              :is="latestStatus.icon"
              width="16"
              height="16"
              :class="{'animate-spin': latestStatus.spin}"
              :data-cy="'run-status-dot-latest'"
            />
          </li>
        </ol>
      </div>
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
            :spec-file-no-extension="props.gql.fileName"
            :spec-file-extension="props.gql.specFileExtension"
          />
        </ExternalLink>
      </template>
    </component>
  </component>
  <div
    v-else
    class="bg-gray-50 rounded-[20px] animate-pulse"
  >
    &nbsp;
  </div>
</template>

<script setup lang="ts">

import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { RunStatusDotsFragment, RunStatusDots_RefetchDocument } from '../generated/graphql'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import { computed, watch, watchEffect } from 'vue'
import CancelledIcon from '~icons/cy/cancelled-solid_x16.svg'
import ErroredIcon from '~icons/cy/errored-solid_x16.svg'
import FailedIcon from '~icons/cy/failed-solid_x16.svg'
import PassedIcon from '~icons/cy/passed-solid_x16.svg'
import PlaceholderIcon from '~icons/cy/placeholder-solid_x16.svg'
import RunningIcon from '~icons/cy/running-outline_x16.svg'
import SpecRunSummary from './SpecRunSummary.vue'
import { gql, useMutation } from '@urql/vue'

gql`
mutation RunStatusDots_Refetch ($ids: [ID!]!) {
  loadRemoteFetchables(ids: $ids){
    id
    status
  }
}
`

const refetchMutation = useMutation(RunStatusDots_RefetchDocument)

const refetch = () => {
  if (!props.isProjectDisconnected && props.gql.cloudSpec?.id && !refetchMutation.fetching.value) {
    refetchMutation.executeMutation({ ids: [props.gql.cloudSpec?.id] })
  }
}

gql`
fragment RunStatusDots on Spec {
  id
  specFileExtension
  fileName  
  cloudSpec(name: "RunStatusDots") @include(if: $hasBranch) {
    id
    status
    data {
      id
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

const props = withDefaults(defineProps<{
  gql: RunStatusDotsFragment
  isProjectDisconnected: boolean
  isOnline: boolean
}>(), {
  isProjectDisconnected: false,
  isOnline: true,
})

watchEffect(
  () => {
    if (props.isOnline && (props.gql.cloudSpec?.status === 'NOT_FETCHED' || props.gql.cloudSpec?.status === undefined)) {
      refetch()
    }
  },
)

const runs = computed(() => {
  return props.gql.cloudSpec?.data?.specRuns?.nodes ?? []
})

const dotClasses = computed(() => {
  const statuses = ['placeholder', 'placeholder', 'placeholder']

  if (runs.value && runs.value.length > 0) {
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

watch(() => props.isProjectDisconnected, (value, oldValue) => {
  if (value && !oldValue) {
    refetch()
  }
})

</script>
