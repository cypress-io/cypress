<template>
  <button
    class="block w-full overflow-hidden mb-4 border border-gray-100
  rounded bg-light-50 hocus-default"
  >
    <ListRowHeader>
      <template #icon>
        <RunIcon :gql="props.gql" />
      </template>
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
import ListRowHeader from '@cy/components/ListRowHeader.vue'
import { gql } from '@urql/core'
import RunIcon from './RunIcon.vue'
import RunResults from './RunResults.vue'
import type { RunCardFragment } from '../generated/graphql'
import { computed } from 'vue-demi'

gql`
fragment RunCard on CloudRun {
	id
	createdAt
	...RunIcon
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

const run = computed(() => props.gql)

</script>
