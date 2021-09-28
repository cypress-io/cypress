<template>
	<div class="h-7 border border-gray-200 rounded flex text-gray-500" :class="class">
		<div class="flex items-center p-2">
			<IconFlake class="text-gray-400 text-sm mr-1" />
			0
			<!-- 
				TODO: Is flake even exposed via the API?
				{{props.flake}} 
				-->
		</div>
		<div class="flex items-center p-2">
			<IconCancel class="text-gray-400 text-sm mr-1" />
			{{props.gql.totalSkipped}}
		</div>
		<div class="flex items-center p-2">
			<IconPass class="text-green-600 text-xs mr-1" />
			{{props.gql.totalPassed}}
		</div>
		<div class="flex items-center p-2">
			<IconFail class="text-red-600 mr-1" />
			{{props.gql.totalFailed}}
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { RunResultsFragment } from '../generated/graphql'
import { gql } from '@urql/core'
// bi:check-lg
import IconPass from '~icons/bi/check-lg'
// eva:close-fill
import IconFail from '~icons/eva/close-fill'
// fa-solid:snowflake
import IconFlake from '~icons/fa-solid/snowflake'
// line-md:cancel
import IconCancel from '~icons/line-md/cancel'

gql`
fragment RunResults on CloudRun {
	id
	totalPassed
	totalFailed
	totalPending
	totalSkipped
	totalDuration
}
`

const props = defineProps<{
	gql: RunResultsFragment
}>()
</script>
