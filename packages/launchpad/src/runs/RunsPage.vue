<template>
	<main class="min-w-650px max-w-800px">
		<RunCard v-for="run in runs" v-bind="run"/>
	</main>
</template>

<script lang="ts" setup>
import RunCard from "./RunCard.vue";

// wire gql here
const runs = []

</script>