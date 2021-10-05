<template>
  <div>
    <div id="runner-vue" />
    <div id="reporter-vue" />
  </div>
</template>

<script lang="ts">
import { toJS } from 'mobx'

let _config: any
let _projectName: string

export const runSpec = () => {
  console.log(toJS(store.spec))
  if (!store.spec) {
    return
  }

  const reporterEl = document.createElement('div')
  reporterEl.id = 'reporter-root'
  const el = document.querySelector<HTMLDivElement>('#reporter-vue')!
  el.appendChild(reporterEl)

  renderReporter(el, store.spec, window.UnifiedRunner.eventManager)
  window.UnifiedRunner.start({ config: _config, projectName: _projectName, store, spec: store.spec })
}

</script>

<script lang="ts" setup>
import { ConfigConsumedByNewRunner, Payload, renderRunner } from '../runner/renderRunner'
import { renderReporter } from '../runner/renderReporter'
import { onMounted } from '@vue/runtime-core'
import { gql } from '@urql/vue'
import type { Specs_SpecsFragment } from '../generated/graphql'
import { store } from '../store'
import type { SpecFile } from '@packages/types/src/spec'


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

const props = defineProps<{
  gql: Specs_SpecsFragment
  spec?: SpecFile
}>()

declare global {
  interface Window {
    Runner: any
  }
}

const initRunner = ({ base64Config, projectName }: Payload) => {
  const config = window.UnifiedRunner.decodeBase64(base64Config) as ConfigConsumedByNewRunner
  store.setSpecs(config.specs)
  _config = config
  _projectName = projectName

}

onMounted(() => {
  renderRunner(initRunner)
})

</script>

<route>
{
  name: "Specs Page"
}
</route>

<style>
</style>