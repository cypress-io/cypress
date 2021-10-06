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
  </div>
</template>

<script lang="ts">
// import { toJS } from 'mobx'

// let _config: any
// let _projectName: string

// export const runSpec = () => {
//   console.log(toJS(store.spec))
//   if (!store.spec) {
//     return
//   }

//   const reporterEl = document.createElement('div')
//   reporterEl.id = 'reporter-root'
//   const el = document.querySelector<HTMLDivElement>('#reporter-vue')!
//   el.appendChild(reporterEl)

//   renderReporter(el, store.spec, window.UnifiedRunner.eventManager)
//   window.UnifiedRunner.start({ config: _config, projectName: _projectName, store, spec: store.spec })
// }

</script>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { initialize, setupSpec, teardownSpec } from '../runner'
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

const executeSpec = async (spec: typeof s1) => {
  await teardownSpec(store)
  return setupSpec(spec)
}

store.setSpecs([s1, s2])

onMounted(() => {
  console.log('Mounted. Initializing...')
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