<template>
  <ExternalLink
    :data-cy="`runCard-${run.id}`"
    class="border rounded bg-light-50 border-gray-100 w-full block overflow-hidden hocus-default"
    :href="runUrl"
    :use-default-hocus="false"
  >
    <ListRowHeader
      :data-cy="`run-card-icon-${run.status}`"
    >
      <template #icon>
        <SolidStatusIcon
          size="24"
          :status="STATUS_MAP[run.status!]"
        />
      </template>
      <template #header>
        <span class="font-semibold mr-[8px] whitespace-pre-wrap">{{ run.commitInfo?.summary }}</span>
        <span
          v-for="tag in tags"
          :key="tag"
          class="rounded-md font-semibold border-gray-200 border-[1px] text-xs mr-[8px] px-[4px] text-gray-700"
          data-cy="run-tag"
        >{{ tag }}</span>
      </template>
      <template #description>
        <ul class="flex flex-wrap text-sm text-gray-700 gap-[8px] items-center whitespace-nowrap children:flex children:items-center">
          <li
            v-if="run.commitInfo?.authorName"
            data-cy="run-card-author"
          >
            <i-cy-general-user_x16
              class="mr-1 icon-dark-gray-500 icon-light-gray-100 icon-secondary-light-gray-200"
              data-cy="run-card-avatar"
            />
            <span class="sr-only">Commit Author:</span>{{ run.commitInfo.authorName }}
          </li>

          <li
            v-if="run.commitInfo?.branch"
            data-cy="run-card-branch"
          >
            <i-cy-tech-branch-h_x16 class="mr-1 icon-dark-gray-300" />
            <span class="sr-only">Branch Name:</span>{{ run.commitInfo.branch }}
          </li>

          <li
            v-if="run.createdAt"
            data-cy="run-card-created-at"
          >
            <span class="sr-only">Run Created At:</span>{{ relativeCreatedAt }}
          </li>

          <li
            v-if="run.totalDuration"
            data-cy="run-card-duration"
          >
            <span class="sr-only">Run Total Duration:</span>{{ totalDuration }}
          </li>
        </ul>
      </template>
      <template #middle>
        <RunResults :gql="props.gql" />
      </template>
    </ListRowHeader>
  </ExternalLink>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { gql } from '@urql/core'
import RunResults from './RunResults.vue'
import type { CloudRunStatus, RunCardFragment } from '../generated/graphql'
import { dayjs } from './utils/day.js'
import { useDurationFormat } from '../composables/useDurationFormat'
import { SolidStatusIcon, StatusType } from '@cypress-design/vue-statusicon'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

gql`
fragment RunCard on CloudRun {
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

const STATUS_MAP: Record<CloudRunStatus, StatusType> = {
  PASSED: 'passed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ERRORED: 'errored',
  RUNNING: 'running',
  NOTESTS: 'noTests',
  OVERLIMIT: 'overLimit',
  TIMEDOUT: 'timedOut',
} as const

const props = defineProps<{
  gql: RunCardFragment
}>()

const run = computed(() => props.gql)

const runUrl = computed(() => {
  return getUrlWithParams({
    url: run.value.url || '#',
    params: {
      utm_medium: 'Runs Tab',
      utm_campaign: 'Cloud Run',
    },
  })
})

const relativeCreatedAt = computed(() => dayjs(new Date(run.value.createdAt!)).fromNow())

const totalDuration = useDurationFormat(run.value.totalDuration ?? 0)

const tags = computed(() => {
  const tags = (props.gql.tags ?? []).map((tag) => tag?.name).filter(Boolean) as string[]

  return tags.length <= 2 ? tags : tags.slice(0, 2).concat(`+${tags.length - 2}`)
})

</script>

<style scoped>
li:not(:first-child)::before {
  content: '•';
  @apply text-lg text-gray-400 pr-[8px]
}
</style>
