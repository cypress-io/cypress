<template>
  <!-- 
    We want to manage the reporter and runner iframe with vanilla JS/jQuery
    Prevent Vue from re-rendering these elements with v-once.
  -->
  <div v-once>
    <button v-for="spec of specs" @click="executeSpec(spec)">
      {{ spec.name }}
    </button>
    
    <div id="unified-runner" />
    <div id="unified-reporter" />
    <button @click="setupReporter">Setup</button>
    <button @click="unmountReporter">Teardown</button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { initialize, setupReporter, setupSpec, teardownSpec, } from '../runner'
import { unmountReporter } from '../runner/renderReporter'
import { store } from '../store'

const s1 = {
  name: "HelloWorld1.spec.tsx",
  relative: "src/HelloWorld1.spec.tsx",
  absolute: "/Users/lachlan/code/work/cypress5/packages/app/src/HelloWorld1.spec.tsx"
}

const s2 = {
  name: "HelloWorld2.spec.tsx",
  relative: "src/HelloWorld2.spec.tsx",
  absolute: "/Users/lachlan/code/work/cypress5/packages/app/src/HelloWorld2.spec.tsx"
}

const specs = [s1, s2]

store.setSpec(s1)


const delay = () => new Promise(res => setTimeout(res, 0))

const first = ref(true)

const executeSpec = async (spec: typeof s1) => {
  store.setSpec(spec)

  await unmountReporter()

  if (first.value === false) {
    await window.UnifiedRunner.eventManager.teardownReporter()
  }

  await delay()
  await teardownSpec(store)

  await delay()
  setupReporter()
  await delay()
  first.value = false
  return setupSpec(spec)
}

store.setSpecs([s1, s2])

onMounted(() => {
  initialize()
})


// import { ConfigConsumedByNewRunner, Payload, renderRunner } from '../runner/renderRunner'
// import { renderReporter } from '../runner/renderReporter'
// import { onMounted } from '@vue/runtime-core'
// import { gql } from '@urql/vue'
// import type { Specs_SpecsFragment } from '../generated/graphql'
// import { store } from '../store'
// import type { SpecFile } from '@packages/types/src/spec'


// gql`
// fragment Specs_Spec on Spec {
//   specType
//   absolute
//   name
//   relative
// }
// `

// gql`
// fragment Specs_Specs on Project {
//   specs(first: 10) {
//     edges {
//       node {
//         ...Specs_Spec
//       }
//     }
//   }
// }
// `

// const props = defineProps<{
//   gql: Specs_SpecsFragment
//   spec?: SpecFile
// }>()

// declare global {
//   interface Window {
//     Runner: any
//   }
// }

// const initRunner = ({ base64Config, projectName }: Payload) => {
//   const config = window.UnifiedRunner.decodeBase64(base64Config) as ConfigConsumedByNewRunner
//   store.setSpecs(config.specs)
//   _config = config
//   _projectName = projectName

//   window.UnifiedRunner.eventManager.on('restart', () => {
//     runSpec()
//   })
// }

// onMounted(() => {
//   renderRunner(initRunner)
// })

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