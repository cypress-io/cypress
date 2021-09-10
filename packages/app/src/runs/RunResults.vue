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
			{{props.totals.totalSkipped}}
		</div>
		<div class="flex items-center p-2">
			<IconPass class="text-green-600 text-xs mr-1" />
			{{props.totals.totalPassed}}
		</div>
		<div class="flex items-center p-2">
			<IconFail class="text-red-600 mr-1" />
			{{props.totals.totalFailed}}
		</div>
	</div>
</template>

<script lang="ts" setup>
// bi:check-lg
import type { RunGroupTotals } from '@packages/graphql/src/entities/run'
import IconPass from 'virtual:vite-icons/bi/check-lg'
// eva:close-fill
import IconFail from 'virtual:vite-icons/eva/close-fill'
// fa-solid:snowflake
import IconFlake from 'virtual:vite-icons/fa-solid/snowflake'
// line-md:cancel
import IconCancel from 'virtual:vite-icons/line-md/cancel'

const props = defineProps<{
	totals: RunGroupTotals
}>()
</script>