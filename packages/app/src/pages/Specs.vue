<template>
  <div>
    <h2>Specs Page</h2>
    <div id="runner-vue" />
    <div id="reporter-vue" />
  </div>
</template>

<script lang="ts" setup>
import { renderRunner } from '../runner/renderRunner'
import { renderReporter } from '../runner/renderReporter'
import { onMounted } from '@vue/runtime-core'

declare global {
  interface Window {
    Runner: any
  }
}

const run = ({ base64Config, projectName }) => {
  const config = window.Runner.decodeBase64(base64Config)

  window.Runner.start({ config, projectName })

  const reporterEl = document.createElement('div')
  reporterEl.id = 'reporter-root'
  const el = document.querySelector<HTMLDivElement>('#reporter-vue')!
  el.appendChild(reporterEl)

  renderReporter(el, window.Runner.spec, window.Runner.eventManager)
}

onMounted(() => {
  renderRunner(run)
})

</script>

<route>
{
  name: "Specs Page"
}
</route>

<style>
</style>