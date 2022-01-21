<template>
  <ExternalLink
    :data-cy="`runCard-${run.id}`"
    class="border rounded bg-light-50 border-gray-100 mb-4 w-full
  block overflow-hidden hocus-default"
    :href="run.url || '#'"
    :use-default-hocus="false"
  >
    <ListRowHeader
      :icon="icon"
      data-cy="run-card-icon"
    >
      <template #header>
        {{ run.commitInfo?.summary }}
      </template>
      <template #description>
        <div class="flex">
          <span
            v-if="run.commitInfo?.authorName"
            class="flex mr-3 items-center"
            data-cy="run-card-author"
          >
            <i-cy-general-user_x16
              class="mr-1 icon-dark-gray-500 icon-light-gray-200 icon-secondary-light-gray-200"
              data-cy="run-card-avatar"
            />
            <span class="font-light text-sm text-gray-500">
              {{ run.commitInfo.authorName }}
            </span>
          </span>
          <span
            v-if="run.commitInfo?.branch"
            class="flex mr-3 items-center"
          >
            <i-cy-tech-branch-h_x16 class="mr-1 icon-dark-gray-300" />
            <span
              class="font-light text-sm text-gray-500"
              data-cy="run-card-branch"
            >
              {{ run.commitInfo.branch }}
            </span>
          </span>
          <span
            v-if="run.createdAt"
            class="flex mr-3 items-center"
          >
            {{ new Date(run.createdAt).toLocaleTimeString() }}
          </span>
        </div>
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

gql`
fragment RunCard on CloudRun {
	id
	createdAt
	status
  url
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

</script>
