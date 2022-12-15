<template>
  <div
    data-cy="debug"
    class="flex flex-col gap-16px"
  >
    <div
      data-cy="debug-header"
      class="flex grid items-center w-full overflow-hidden py-24px px-24px gap-y-2"
    >
      <ul
        data-cy="header-top"
        class="flex flex-row items-center self-stretch gap-x-2 whitespace-nowrap"
      >
        <li
          v-if="debug?.commitInfo?.summary"
          class="text-lg font-medium text-gray-900"
          data-cy="debug-test-summary"
        >
          {{ debug.commitInfo.summary }}
        </li>
        <li
          v-if="props.commitsAhead"
          class="flex items-center h-6 text-sm border border-gray-100 rounded"
        >
          <span
            v-if="props.commitsAhead"
            class="items-center px-2 mx-px font-normal text-orange-500"
            data-cy="debug-commitsAhead"
          >
            {{ t('debugPage.header.commitsAhead', props.commitsAhead) }}
          </span>
        </li>
        <li class="text-lg text-gray-400 -mt-8px">
          .
        </li>
        <li class="text-sm font-normal text-indigo-500">
          <ExternalLink
            data-cy="debug-header-dashboard-link"
            :href="debug.url || '#'"
            :use-default-hocus="false"
          >
            <span class="sr-only">Dashboard Link:</span> {{ t('debugPage.header.runUrl') }}
          </ExternalLink>
        </li>
      </ul>
      <ul
        data-cy="metadata"
        class="flex flex-wrap items-center text-sm font-normal text-gray-700 gap-x-2 whitespace-nowrap children:flex children:items-center"
      >
        <li
          class="flex flex-row items-center justify-center text-sm gap-x-2"
        >
          <div
            v-if="(debug.runNumber && debug.status)"
            class="flex flex-row items-center justify-center h-6 px-2 font-semibold border border-gray-200 rounded bg-gray-50 gap-x-1"
            :data-cy="`debug-runNumber-${debug.status}`"
          >
            <SolidStatusIcon
              size="16"
              :status="ICON_MAP[debug.status].type"
            />
            <span :class="runNumberColor">
              {{ `#${debug.runNumber}` }}
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
          <i-cy-tech-branch-h_x16 class="mr-1 mr-8px icon-dark-gray-300" />
          <span class="sr-only">Branch Name:</span> {{ debug.commitInfo.branch }}
        </li>
        <li
          v-if="debug.commitInfo?.sha"
          data-cy="debug-header-commitHash"
        >
          <CommitIcon
            class="h-16px fill-white mr-11px w-16px"
          />
          <span class="sr-only">Commit Hash:</span> {{ debug.commitInfo?.sha?.substring(0,7) }}
        </li>
        <li
          v-if="debug?.commitInfo?.authorName"
          data-cy="debug-header-author"
        >
          <i-cy-general-user_x16
            class="mr-1 mr-11px icon-dark-gray-500 icon-light-gray-100 icon-secondary-light-gray-200"
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
          <span class="sr-only">Run Total Duration:</span> {{ totalDuration }} ({{ relativeCreatedAt }})
        </li>
      </ul>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import DebugResults from './DebugResults.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { DebugPageFragment, CloudRunStatus } from '../generated/graphql'
import { IconTimeStopwatch } from '@cypress-design/vue-icon'
import { SolidStatusIcon } from '@cypress-design/vue-statusicon'
import type { statusTypes } from '@cypress-design/vue-statusicon/dist/StatusIcon/constants'
import CommitIcon from '~icons/cy/commit_x14'
import { gql } from '@urql/core'
import { dayjs } from '../runs/utils/day.js'
import { useI18n } from 'vue-i18n'
import { useDurationFormat } from '../composables/useDurationFormat'

const { t } = useI18n()

gql`
fragment DebugPage on CloudRun {
  id
  runNumber
  createdAt
  status
  totalDuration
  commitInfo {
    sha
  }
  url
  ...RunResults
  commitInfo {
    authorName
    summary
    branch
  }
}
`

const props = defineProps<{
  gql: DebugPageFragment
  commitsAhead: number
}>()

const debug = computed(() => props.gql)

const ICON_MAP: Record<CloudRunStatus, { textColor: string, type: statusTypes }> = {
  PASSED: { textColor: 'text-jade-400', type: 'passed' },
  FAILED: { textColor: 'text-red-400', type: 'failed' },
  CANCELLED: { textColor: 'text-gray-500', type: 'cancelled' },
  ERRORED: { textColor: 'text-orange-400', type: 'errored' },
  RUNNING: { textColor: 'text-indigo-500', type: 'running' },
  NOTESTS: { textColor: 'text-indigo-500', type: 'noTests' },
  OVERLIMIT: { textColor: 'text-indigo-500', type: 'overLimit' },
  TIMEDOUT: { textColor: 'text-indigo-500', type: 'timedOut' },
} as const

const runNumberColor = computed(() => {
  if (props.gql.status) {
    return ICON_MAP[props.gql.status].textColor
  }

  return ''
})

const relativeCreatedAt = computed(() => dayjs(new Date(debug.value.createdAt!)).fromNow())

const totalDuration = useDurationFormat(debug.value.totalDuration ?? 0)

</script>
<style scoped>
[data-cy=metadata] li:not(:first-child)::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
