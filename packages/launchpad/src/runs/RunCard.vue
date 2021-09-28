<template>
	<div class="h-18 border border-gray-200 rounded bg-white flex items-center mb-2 box-border">
		<div class="w-18 flex items-center justify-center">
			<RunIcon :gql="props.gql" />
		</div>
		<div class="pl-4 border-l border-gray-200 flex-grow" v-if="run.commitInfo">
			<h2 class="font-medium text-indigo-500 leading-4">{{ run.commitInfo.message }}</h2>
			<div class="flex">
				<span v-for="info in runInfo" class="flex items-center mr-3 mt-1">
					<component v-if="info.icon" :is="info.icon" class="mr-1 text-gray-500 text-sm" />
					<span class="text-gray-500 text-sm font-light">
						{{info.text}}
					</span>
				</span>
			</div>
		</div>
		<RunResults :gql="props.gql" class="m-6 ml-0" />
	</div>
</template>

<script lang="ts" setup>
import RunIcon from './RunIcon.vue'
import RunResults from './RunResults.vue'
// bx:bx-user-circle
import IconUserCircle from '~icons/bx/bx-user-circle'
// carbon:branch
import IconBranch from '~icons/carbon/branch'
import { gql } from '@urql/core'
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
	text: run.value.commitInfo?.authorName,
	icon: IconUserCircle
},
{
	text: run.value.commitInfo?.branch,
	icon: IconBranch
},
{
	text: run.value.createdAt ? new Date(run.value.createdAt).toLocaleTimeString() : null
}].filter(o => Boolean(o.text))

</script>
