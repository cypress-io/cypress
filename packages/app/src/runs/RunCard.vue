<template>
  <ExternalLink
    :data-cy="`runCard-${run.id}`"
    class="border rounded bg-light-50 border-gray-100 w-full
  block overflow-hidden hocus-default"
    :href="run.url || '#'"
    :use-default-hocus="false"
  >
    <ListRowHeader
      :icon="icon"
      :data-cy="`run-card-icon-${run.status}`"
    >
      <template #header>
        <span class="font-semibold mr-8px whitespace-pre-wrap">{{ run.commitInfo?.summary }}</span>
        <span
          v-for="tag in tags"
          :key="tag"
          class="rounded-md font-semibold border-gray-200 border-1px text-xs mr-8px px-4px text-gray-700"
          data-cy="run-tag"
        >{{ tag }}</span>
      </template>
      <template #description>
        <ul class="flex flex-wrap text-sm text-gray-700 gap-8px items-center whitespace-nowrap children:flex children:items-center">
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
      <template #right>
        <RunResults
          :gql="run"
        />
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
import type { RunCardFragment } from '../generated/graphql'
import PassedIcon from '~icons/cy/status-passed-solid_x24.svg'
import FailedIcon from '~icons/cy/status-failed-solid_x24.svg'
import ErroredIcon from '~icons/cy/status-errored-solid_x24.svg'
import SkippedIcon from '~icons/cy/status-skipped_x24.svg'
import PendingIcon from '~icons/cy/status-pending_x24.svg'
import { dayjs } from './utils/day.js'

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

const props = defineProps<{
  gql: RunCardFragment
}>()

const ICON_MAP = {
  PASSED: PassedIcon,
  FAILED: FailedIcon,
  TIMEDOUT: ErroredIcon,
  ERRORED: ErroredIcon,
  OVERLIMIT: ErroredIcon,
  CANCELLED: SkippedIcon,
  NOTESTS: SkippedIcon,
  RUNNING: PendingIcon,
} as const

const icon = computed(() => ICON_MAP[props.gql.status!])

const run = computed(() => props.gql)

const relativeCreatedAt = computed(() => dayjs(new Date(run.value.createdAt!)).fromNow())

const totalDuration = computed(() => dayjs.duration(run.value.totalDuration!).format('HH:mm:ss').replace(/^0+:/, ''))

const tags = computed(() => {
  const tags = (props.gql.tags ?? []).map((tag) => tag?.name).filter(Boolean) as string[]

  return tags.length <= 2 ? tags : tags.slice(0, 2).concat(`+${tags.length - 2}`)
})

</script>

<style scoped>
li:not(:first-child)::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
