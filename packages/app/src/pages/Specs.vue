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
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import SpecsList from '../specs/SpecsList.vue'
import { REPORTER_ID, RUNNER_ID } from '../runner/utils'
import type { Specs_SpecsFragment } from '../generated/graphql'

gql`
fragment Specs_Specs on App {
  ...Specs_SpecsList
}`

const props = defineProps<{
  gql: Specs_SpecsFragment
}>()
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
