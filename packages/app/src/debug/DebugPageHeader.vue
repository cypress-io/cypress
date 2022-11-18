<template>
  <div
    data-cy="debug"
    class="flex flex-col pb-24px gap-16px"
  >
    <div
      :data-cy="`debug-header`"
      class="grid px-24px w-full overflow-hidden flex items-center gap-y-2 py-24px"
    >
      <ul
        :data-cy="'header-top'"
        class="flex self-stretch items-center gap-x-2 flex-row whitespace-nowrap"
      >
        <li
          v-if="debug?.commitInfo?.summary"
          class="font-medium text-lg text-gray-900"
          data-cy="debug-test-summary"
        >
          {{ debug.commitInfo.summary }}
        </li>
        <div
          v-if="defaultscommitInfo.runNumber && props.commitsAhead"
          class="border rounded border-gray-100 items-center flex text-sm h-6"
          data-cy="debug-runCommit-info"
        >
          <span
            class="font-medium text-gray-700 px-2 mx-px items-center"
            data-cy="debug-runNumber"
          >
            {{ defaultscommitInfo.runNumber }}
          </span>
          <div class="w-px h-3 my-6px bg-gray-100" />
          <span
            class="font-normal text-orange-500 px-2 mx-px items-center"
            data-cy="debug-commitsAhead"
          >
            {{ props.commitsAhead }}
          </span>
        </div>
        <li class="-mt-8px text-lg text-gray-400">
          .
        </li>
        <li class="font-normal text-sm text-indigo-500">
          <ExternalLink
            :data-cy="'debug-header-dashboard-link'"
            :href="debug.url || '#'"
            :use-default-hocus="false"
          >
            <span class="sr-only">Dashboard Link:</span> View in the dashboard
          </ExternalLink>
        </li>
      </ul>
      <ul
        :data-cy="'metadata'"
        class="flex flex-wrap gap-x-2 items-center whitespace-nowrap children:flex children:items-center font-normal text-sm text-gray-700"
      >
        <li
          :data-cy="'debug-results'"
        >
          <DebugResults
            :gql="props.gql"
          />
        </li>
        <li
          v-if="debug?.commitInfo?.branch"
          data-cy="debug-header-branch"
        >
          <i-cy-tech-branch-h_x16 class="mr-1 icon-dark-gray-300 mr-9px" />
          <span class="sr-only">Branch Name:</span> {{ debug.commitInfo.branch }}
        </li>
        <li
          v-if="defaultscommitInfo.commitHash"
          data-cy="debug-header-commitHash"
        >
          <CommitIcon
            class="fill-white h-16px w-16px mr-11px"
          />
          <span class="sr-only">Commit Hash:</span> {{ defaultscommitInfo.commitHash }}
        </li>
        <li
          v-if="debug?.commitInfo?.authorName"
          data-cy="debug-header-author"
        >
          <i-cy-general-user_x16
            class="mr-1 icon-dark-gray-500 icon-light-gray-100 icon-secondary-light-gray-200 mr-11px"
            data-cy="debug-header-avatar"
          />
          <span class="sr-only">Commit Author:</span> {{ debug.commitInfo.authorName }}
        </li>
        <li
          v-if="debug.createdAt"
          data-cy="debug-header-createdAt"
        >
          <IconTimeStopwatch
            size="16"
            class="mr-9px"
            stroke-color="gray-500"
            fill-color="gray-50"
          />
          <span class="sr-only">Run Total Duration:</span> {{ debug.totalDuration }} ({{ relativeCreatedAt }})
        </li>
      </ul>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import DebugResults from './DebugResults.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { DebugPageFragment } from '../generated/graphql'
import CommitIcon from '~icons/cy/commit_x14'
import { IconTimeStopwatch } from '@cypress-design/vue-icon'
import { gql } from '@urql/core'
import { dayjs } from '../runs/utils/day.js'

interface DefaultcommitInfoTypes {
  authorName: string
  branch: string
  summary: string
  runNumber: string
  commitHash: string
}

interface DefaultTypes {
  id: string
  createdAt: string
  totalDuration: string
  url: string
  authorEmail: string
  commitInfo: DefaultcommitInfoTypes
}

// the query below will also be updated to fetch debug page information
// runNumber and commitHash dont exist in the query and should be queried
gql`
fragment DebugPage on CloudRun {
	id
	createdAt
	status
  totalDuration
  url
  tags {
    id
    name
  }
	...RunResults
	commitInfo {
		authorName
		authorEmail
		summary
		branch
	}
}
`

const props = defineProps<{
  gql: DebugPageFragment
  commitsAhead: string
}>()

// These default values exist in case no values are returned by the query
const defaultscommitInfo: DefaultcommitInfoTypes = {
  authorName: 'ankithmehta',
  branch: 'feature/DESIGN-183',
  summary: 'Adding a hover state to the button component',
  runNumber: 'Run #468',
  commitHash: 'b5e6fde',
}

const defaultValues: DefaultTypes = {
  id: '3',
  createdAt: '2022-11-14T14:41:23.078Z',
  totalDuration: '10m 30s',
  url: 'cloud.cypress.io',
  authorEmail: 'hello@cypress.io',
  commitInfo: defaultscommitInfo,
}

const debug = computed(() => {
  if (props.gql) {
    return props.gql
  }

  return defaultValues
})

const relativeCreatedAt = computed(() => dayjs(new Date(debug.value.createdAt!)).fromNow())

</script>
<style scoped>
ul:nth-child(2) li:not(:first-child)::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
