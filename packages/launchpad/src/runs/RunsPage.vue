<template>
	<main class="min-w-650px max-w-800px">
		<RunCard 
      v-for="{commit, run} of runGroups" 
      :run="run"
      :commit="commit"
    />
	</main>
</template>

<script lang="ts" setup>
import { gql } from "@urql/core";
import { useQuery } from "@urql/vue";
import { computed } from "vue-demi";
import { RunGroupsDocument } from "../generated/graphql";
import RunCard from "./RunCard.vue";

gql`
query RunGroups {
  runs(projectId: "ypt4pf") {
    createdAt
    totalPassed
    totalFailed
    totalPending
    totalSkipped
    totalDuration
    status
    commit {
      authorName
      authorEmail
      message
      branch
    }
  }
}
`

const result = useQuery({ query: RunGroupsDocument })

const runGroups = computed(() => {
  return result.data.value?.runs!.map((group) => {
    const { commit, ...run } = group!
    return {
      commit,
      run
    }
  })
}) 
</script>