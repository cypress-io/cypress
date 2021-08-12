<template>
	<main class="min-w-650px max-w-800px">
		Runs page
		<RunCard 
			v-for="run of runs" 
			:gql="run"
			:key="run.createdAt"
		/>
	</main>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import { computed, watch } from 'vue'
import RunCard from './RunCard.vue'
import { RunPageRootDocument } from '../generated/graphql'

gql`
query RunPageRoot {
	viewer {
		getProjectByProjectId(projectId: "ypt4pf") {
			runs {
				...Run
			}
		}
	}
}
`

const result = useQuery({ query: RunPageRootDocument })

const data = computed(() => result.data?.value?.viewer)
const runs =  computed(() => result.data?.value?.viewer?.getProjectByProjectId?.runs || [])

</script>