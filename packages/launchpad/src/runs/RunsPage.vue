<template>
	<main class="min-w-650px max-w-800px">
		<RunCard 
      v-for="run of runs" 
      :gql="run"
    />
	</main>
</template>

<script lang="ts" setup>
import { gql } from "@urql/core";
import { useQuery } from "@urql/vue";
import { computed } from "vue";
import { AppDocument, } from "../generated/graphql";
import RunCard from "./RunCard.vue";

gql`
query App {
  app {
    runGroups(projectId: "ypt4pf") {
      ...RunCard
    }
  }
}
`

const result = useQuery({ query: AppDocument })

// TODO: Is there something less convoluted to avoid the fact everything
// is nullable in GraphQL?
const runs = computed(() => result?.data?.value?.app?.runGroups || [])!
</script>