<template>
  <h2>Specs Page</h2>

  <SpecsList
    v-if="props.gql"
    :gql="props?.gql"
  />

  <p v-else>
    Loading...
  </p>

  <!-- <div
    v-for="spec of props.gql?.specs?.edges"
    :key="spec?.node?.absolute"
  >
    <button
      @click="execute(spec?.node ?? undefined)"
    >
      {{ spec?.node?.relative }}
    </button>
  </div> -->

  <!--
       We want to manage the reporter and runner iframe with vanilla JS/jQuery
       Prevent Vue from re-rendering these elements with v-once.
   -->
  <div v-once>
    <div :id="RUNNER_ID" />
    <div :id="REPORTER_ID" />
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import { onMounted } from 'vue'
import SpecsList from '../specs/SpecsList.vue'
import { UnifiedRunnerAPI } from '../runner'
import { REPORTER_ID, RUNNER_ID } from '../runner/utils'
import type { Specs_SpecsFragment } from '../generated/graphql'
import type { SpecFile } from '@packages/types/src'

gql`
fragment Specs_Specs on App {
  ...Specs_SpecsList
}`

const props = defineProps<{
  gql: Specs_SpecsFragment
}>()

onMounted(() => {
  UnifiedRunnerAPI.initialize()
})

const execute = (spec?: SpecFile) => {
  if (!spec) {
    return
  }

  UnifiedRunnerAPI.executeSpec(spec)
}
</script>

<route>
{
  name: "Specs Page"
}
</route>

<style>
iframe {
  border: 5px solid black;
  margin: 10px;
  background: lightgray;
}
</style>
