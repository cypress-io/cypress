<template>
	<div class="h-18 border border-gray-200 rounded bg-white flex items-center mb-2 box-border">
		<div class="w-18 flex items-center justify-center">
			<RunIcon :status="status" />
		</div>
		<div class="pl-4 border-l border-gray-200 flex-grow">
			<h2 class="font-medium text-indigo-500 leading-4">{{ props.commit.message || '' }}</h2>
			<div class="flex">
				<span v-for="info in runInfo" class="flex items-center mr-3 mt-1">
					<component v-if="info.icon" :is="info.icon" class="mr-1 text-gray-500 text-sm" />
					<span class="text-gray-500 text-sm font-light">
						{{info.text}}
					</span>
				</span>
			</div>
		</div>
		<RunResults :totals="runGroupTotals" class="m-6 ml-0" />
	</div>
</template>

<script lang="ts" setup>
import RunIcon from './RunIcon.vue'
import RunResults from './RunResults.vue'
// bx:bx-user-circle
import IconUserCircle from 'virtual:vite-icons/bx/bx-user-circle'
// carbon:branch
import IconBranch from 'virtual:vite-icons/carbon/branch'
import type { RunGroupStatus } from '../generated/graphql'
import type { RunCommitConfig, RunGroupConfig, RunGroupTotals } from '@packages/graphql'

const props = defineProps<{
	run: Partial<RunGroupConfig>
	commit: Partial<RunCommitConfig>
}>()

const runInfo = [{
	text: props.commit.authorName || '',
	icon: IconUserCircle
},
{
	text: props.commit.branch || '',
	icon: IconBranch
},
{
	text: new Date(props.run.createdAt!).toLocaleTimeString()
}]

const runGroupTotals: RunGroupTotals = {
 totalPassed: props.run.totalPassed || 0,
 totalFailed: props.run.totalFailed || 0,
 totalPending: props.run.totalPending || 0,
 totalSkipped: props.run.totalSkipped || 0,
 totalDuration: props.run.totalDuration || 0,
}

const status = props.run.status!
</script>