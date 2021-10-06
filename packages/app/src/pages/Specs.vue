<template>
  <div v-for="spec of props.gql?.specs?.edges">
    <button
      @click="execute(spec?.node ?? undefined)"
    >
      {{ spec?.node?.relative }}
    </button>
  </div>

  <!-- 
    We want to manage the reporter and runner iframe with vanilla JS/jQuery
    Prevent Vue from re-rendering these elements with v-once.
  -->
  <div v-once> 
    <div id="unified-runner" />
    <div id="unified-reporter" />
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import { onMounted } from 'vue'
import { 
  initialize, 
  setupReporter, 
  executeSpec
  // setupSpec, 
  // teardownSpec, 
} from '../runner'
import { unmountReporter } from '../runner/renderReporter'
// import { store } from '../store'
import type { Specs_SpecsFragment } from '../generated/graphql'
import type { SpecFile } from '@packages/types/src'

onMounted(() => {
  initialize()
})


gql`
fragment Specs_Spec on Spec {
  specType
  absolute
  name
  relative
}
`

gql`
fragment Specs_Specs on Project {
  specs(first: 10) {
    edges {
      node {
        ...Specs_Spec
      }
    }
  }
}
`

const execute = (spec?: SpecFile) => {
  if (!spec) {
    return
  }
  executeSpec(spec)
} 

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