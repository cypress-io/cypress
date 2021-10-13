<template>
  <ListRow>
    <template #icon>
      <RunIcon :gql="props.gql" />
    </template>
    <template #header>
      {{ run.commitInfo?.message }}
    </template>
    <template #description>
      <div class="flex">
        <span
          v-for="info in runInfo"
          :key="info.id"
          class="flex items-center mr-3"
        >
          <component
            :is="info.icon"
            v-if="info.icon"
            class="mr-1 text-sm text-gray-500"
          />
          <span class="text-sm font-light text-gray-500">
            {{ info.text }}
          </span>
        </span>
      </div>
    </template>
    <template #right>
      <RunResults
        :gql="props.gql"
      />
    </template>
  </ListRow>
</template>

<script lang="ts" setup>
import ListRow from '@cy/components/ListRow.vue'
import { gql } from '@urql/core'
import RunIcon from './RunIcon.vue'
import RunResults from './RunResults.vue'
// bx:bx-user-circle
import IconUserCircle from '~icons/bx/bx-user-circle'
// carbon:branch
import IconBranch from '~icons/carbon/branch'
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
		message
		branch
	}
}
`

const props = defineProps<{
	gql: RunCardFragment
}>()

const run = computed(() => props.gql)

const runInfo = [{
  id: run.value.id,
  text: run.value.commitInfo?.authorName,
  icon: IconUserCircle,
},
{
  text: run.value.commitInfo?.branch,
  icon: IconBranch,
},
{
  text: run.value.createdAt ? new Date(run.value.createdAt).toLocaleTimeString() : null,
}].filter((o) => Boolean(o.text))

</script>
