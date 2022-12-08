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
        data-cy="header-top"
        class="flex self-stretch items-center gap-x-2 flex-row whitespace-nowrap"
      >
        <li
          v-if="debug?.commitInfo?.summary"
          class="font-medium text-lg text-gray-900"
          data-cy="debug-test-summary"
        >
          {{ debug.commitInfo.summary }}
        </li>
        <li
          v-if="props.commitsAhead"
          class="border rounded border-gray-100 items-center flex text-sm h-6"
        >
          <span
            class="font-normal text-orange-500 px-2 mx-px items-center"
            data-cy="debug-commitsAhead"
          >
            {{ props.commitsAhead }}
          </span>
        </li>
        <li class="-mt-8px text-lg text-gray-400">
          .
        </li>
        <li class="font-normal text-sm text-indigo-500">
          <ExternalLink
            data-cy="debug-header-dashboard-link"
            :href="debug.url || '#'"
            :use-default-hocus="false"
          >
            <span class="sr-only">Dashboard Link:</span> View in the dashboard
          </ExternalLink>
        </li>
      </ul>
      <ul
        data-cy="metadata"
        class="flex flex-wrap gap-x-2 items-center whitespace-nowrap children:flex children:items-center font-normal text-sm text-gray-700"
      >
        <li
          class="text-sm items-center justify-center flex flex-row gap-x-2"
        >
          <div
            v-if="(props.runNumber && debug.status)"
            class="flex flex-row border rounded border-gray-200 font-semibold items-center px-2 bg-gray-50 justify-center gap-x-1 h-6"
            :data-cy="`debug-runNumber-${debug.status}`"
          >
            <SolidStatusIcon
              size="16"
              :status="debug.status.toLowerCase()"
            />
            <span :class="runNumberColor">
              {{ `#${props.runNumber}` }}
            </span>
          </div>
          <DebugResults
            :gql="props.gql"
            data-cy="debug-results"
          />
        </li>
        <li
          v-if="debug?.commitInfo?.branch"
          data-cy="debug-header-branch"
        >
          <i-cy-tech-branch-h_x16 class="mr-1 icon-dark-gray-300 mr-8px" />
          <span class="sr-only">Branch Name:</span> {{ debug.commitInfo.branch }}
        </li>
        <li
          v-if="props.commitHash"
          data-cy="debug-header-commitHash"
        >
          <CommitIcon
            class="fill-white h-16px w-16px mr-11px"
          />
          <span class="sr-only">Commit Hash:</span> {{ props.commitHash }}
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
import { IconTimeStopwatch } from '@cypress-design/vue-icon'
import { SolidStatusIcon } from '@cypress-design/vue-statusicon'
import CommitIcon from '~icons/cy/commit_x14'
import { gql } from '@urql/core'
import { dayjs } from '../runs/utils/day.js'

// runNumber and commitHash dont currently exist in the query and therefore are being obtained as props instead
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
  commitHash: string
  runNumber: number
}>()

const debug = computed(() => props.gql)

const ICON_MAP = {
  PASSED: { textColor: 'text-jade-400' },
  FAILED: { textColor: 'text-red-400' },
  CANCELLED: { textColor: 'text-gray-500' },
  ERRORED: { textColor: 'text-orange-400' },
  RUNNING: { textColor: 'text-indigo-500' },
}

const runNumberColor = computed(() => ICON_MAP[String(props.gql.status)]['textColor'])

const relativeCreatedAt = computed(() => dayjs(new Date(debug.value.createdAt!)).fromNow())

</script>
<style scoped>
[data-cy=metadata] li:not(:first-child)::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
