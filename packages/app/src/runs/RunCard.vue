<template>
  <button
    class="block w-full overflow-hidden mb-4 border border-gray-100
  rounded bg-light-50 hocus-default"
  >
    <ListRowHeader :icon="icon">
      <template #header>
        {{ run.commitInfo?.summary }}
      </template>
      <template #description>
        <div class="flex">
          <span
            v-if="run.commitInfo?.authorName"
            class="flex items-center mr-3"
          >
            <i-cy-general-user_x16 class="mr-1 icon-dark-gray-500 icon-light-gray-200 icon-secondary-light-gray-200" />
            <span class="text-sm font-light text-gray-500">
              {{ run.commitInfo.authorName }}
            </span>
          </span>
          <span
            v-if="run.commitInfo?.branch"
            class="flex items-center mr-3"
          >
            <i-cy-tech-branch-h_x16 class="mr-1 icon-dark-gray-300" />
            <span class="text-sm font-light text-gray-500">
              {{ run.commitInfo.branch }}
            </span>
          </span>
          <span
            v-if="run.createdAt"
            class="flex items-center mr-3"
          >
            {{ new Date(run.createdAt).toLocaleTimeString() }}
          </span>
        </div>
      </template>
      <template #right>
        <RunResults
          :gql="props.gql"
        />
      </template>
    </ListRowHeader>
  </button>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'
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

const icon = computed(() => {
  return props.gql.status === 'PASSED'
    ? PassedIcon
    : props.gql.status === 'FAILED'
      ? FailedIcon
      : props.gql.status === 'TIMEDOUT' || props.gql.status === 'ERRORED' || props.gql.status === 'OVERLIMIT'
        ? ErroredIcon
        : props.gql.status === 'CANCELLED' || props.gql.status === 'NOTESTS'
          ? SkippedIcon
          : props.gql.status === 'RUNNING'
            ? PendingIcon
            : undefined
})

const run = computed(() => props.gql)

</script>
