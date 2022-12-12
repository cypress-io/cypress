<template>
  <div
    data-cy="debug"
    class="flex flex-col gap-16px"
  >
    <div
      data-cy="debug-header"
      class="flex w-full grid py-24px px-24px gap-y-2 overflow-hidden items-center"
    >
      <ul
        data-cy="header-top"
        class="flex flex-row gap-x-2 self-stretch items-center whitespace-nowrap"
      >
        <li
          v-if="debug?.commitInfo?.summary"
          class="font-medium text-lg text-gray-900"
          data-cy="debug-test-summary"
        >
          {{ debug.commitInfo.summary }}
        </li>
        <div
          class="border rounded flex border-gray-100 h-6 text-sm items-center"
          data-cy="debug-runCommit-info"
        >
          <span
            class="font-medium mx-px px-2 text-gray-700 items-center"
            data-cy="debug-runNumber"
          >
            Run #{{ debug.runNumber }}
          </span>
          <div class="bg-gray-100 h-3 my-6px w-px" />
          <span
            v-if="props.commitsAhead"
            class="font-normal mx-px px-2 text-orange-500 items-center"
            data-cy="debug-commitsAhead"
          >
            {{ t('debugPage.header.commitsAhead', props.commitsAhead) }}
          </span>
        </div>
        <li class="-mt-8px text-lg text-gray-400">
          .
        </li>
        <li class="font-normal text-sm text-indigo-500">
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
        class="flex flex-wrap font-normal text-sm text-gray-700 gap-x-2 items-center whitespace-nowrap children:flex children:items-center"
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
import type { DebugPageFragment } from '../generated/graphql'
import CommitIcon from '~icons/cy/commit_x14'
import { IconTimeStopwatch } from '@cypress-design/vue-icon'
import { gql } from '@urql/core'
import { dayjs } from '../runs/utils/day.js'
import { useI18n } from 'vue-i18n'

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

const relativeCreatedAt = computed(() => dayjs(new Date(debug.value.createdAt!)).fromNow())

/*
  Format duration to in HH:mm:ss format. The `totalDuration` field is milliseconds. Remove the leading "00:" if the value is less
  than an hour. Currently, there is no expectation that a run duration will be greater 24 hours or greater, so it is okay that
  this format would "roll-over" in that scenario.
  Ex: 1 second which is 1000ms = 00:01
  Ex: 1 hour and 1 second which is 3601000ms = 01:00:01
*/

const totalDuration = computed(() => dayjs.duration(debug.value.totalDuration!).format('HH:mm:ss').replace(/^0+:/, ''))

</script>
<style scoped>
[data-cy=metadata] li:not(:first-child)::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
