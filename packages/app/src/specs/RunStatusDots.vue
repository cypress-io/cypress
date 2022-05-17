<template>
  <component
    :is="latestRun? ExternalLink : 'div'"
    v-if="props.gql?.cloudSpec?.status === 'FETCHED'"
    :href="latestRun?.url ?? '#'"
    :use-default-hocus="false"
  >
    <component
      :is="latestRun? Tooltip : 'div'"
      placement="top"
      :is-interactive="latestRun"
      :interactive-highlight-color="latestRunColor"
    >
      <div
        class="flex justify-center"
        data-cy="run-status-dots"
      >
        <ol
          class="list-none h-16px mb-0 pl-0 inline-block"
          q
        >
          <li
            v-for="(dot,i) in dotClasses"
            :key="i"
            class="ml-4px inline-block align-middle"
          >
            <i-cy-dot-solid_x4
              width="4"
              height="4"
              :class="dot"
            />
          </li>
          <li class="ml-4px inline-block align-middle">
            <component
              :is="latestStatus.icon"
              width="16"
              height="16"
              :class="{'animate-spin': latestStatus.spin}"
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
            :spec-file="props.specFile"
          />
        </ExternalLink>
      </template>
    </component>
  </component>
  <div v-else-if="props.gql?.cloudSpec?.status === 'ERRORED'">
    <div
      class="flex justify-center"
    >
      <ol
        class="list-none h-16px mb-0 pl-0 inline-block"
        q
      >
        <li
          v-for="i in [0,1,2]"
          :key="i"
          class="ml-4px inline-block align-middle"
        >
          <i-cy-dot-solid_x4
            width="4"
            height="4"
            class="icon-light-red-500"
          />
        </li>
        <li class="ml-4px inline-block align-middle">
          <a @click.prevent="refetch">
            <i-cy-action-restart_x16
              width="16px"
              height="16px"
              class="icon-light-red-500"
            />
          </a>
        </li>
      </ol>
    </div>
  </div>
  <div
    v-else
    class="bg-gray-50 rounded-[20px]"
  >
    &nbsp;
  <!-- {{ JSON.stringify(props.gql?.cloudSpec?.status) }} -->
  </div>
</template>

<script setup lang="ts">

import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { /*RemoteFetchableStatus,*/ RunStatusDotsFragment, RunStatusDots_RefetchDocument } from '../generated/graphql'
import Tooltip, { InteractiveHighlightColor } from '@packages/frontend-shared/src/components/Tooltip.vue'
import { computed, ComputedRef } from 'vue'
import CancelledIcon from '~icons/cy/cancelled-solid_x16.svg'
import ErroredIcon from '~icons/cy/errored-solid_x16.svg'
import FailedIcon from '~icons/cy/failed-solid_x16.svg'
import PassedIcon from '~icons/cy/passed-solid_x16.svg'
import PlaceholderIcon from '~icons/cy/placeholder-solid_x16.svg'
import RunningIcon from '~icons/cy/running-outline_x16.svg'
import SpecRunSummary from './SpecRunSummary.vue'
import { gql, useMutation } from '@urql/vue'

// type Maybe<T> = T | null;
gql`
fragment RunStatusDots on Spec {
  id
  cloudSpec {
    id
    status
    data {
      id
      specRuns(first: 4, fromBranch: "muaz/test") {
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
  gql: RunStatusDotsFragment | null
  specFile: string|null
  isProjectDisconnected: boolean
}>(), {
  runs: () => [],
  specFile: null,
  isProjectDisconnected: false,
})

const runs = computed(() => {
  return props.gql?.cloudSpec?.data?.specRuns?.nodes ?? []
})

// const isLoading = computed(() => {
//   const loadingStatuses: RemoteFetchableStatus[] = ['FETCHING', 'NOT_FETCHED']

//   return !props.isProjectDisconnected && loadingStatuses.some((s) => s === props.gql?.cloudSpec?.status)
// })

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

const latestRunColor: ComputedRef<InteractiveHighlightColor> = computed(() => {
  const run = latestRun.value

  if (!run) {
    return 'GRAY'
  }

  switch (run.status) {
    case 'PASSED':
      return 'JADE'
    case 'RUNNING':
      return 'INDIGO'
    case 'FAILED':
      return 'RED'
    case 'ERRORED':
    case 'OVERLIMIT':
    case 'TIMEDOUT':
      return 'ORANGE'
    case 'NOTESTS':
    case 'CANCELLED':
      return 'GRAY'
    default:
      return 'GRAY'
  }
})

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
  if (props.gql?.cloudSpec?.id && !refetchMutation.fetching.value) {
    refetchMutation.executeMutation({ ids: [props.gql?.cloudSpec?.id] })
  }
}

</script>

<style scoped>

</style>
