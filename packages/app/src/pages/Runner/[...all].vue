<template>
  <div>
    <h2>Runs Page</h2>
    <h4 v-if="!ready">
      Loading
    </h4>
    <h4 v-else>
      Error: TODO add gql backend for getting the base64Config into the browser
    </h4>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { renderRunner } from '../../runner/renderRunner'

const ready = ref(false)

// @ts-ignore
window.__Cypress__ = true

renderRunner(() => {
  setTimeout(function () {
    // @ts-ignore
    window.Runner.start(document.getElementById('app'), '{{base64Config | safe}}')
  }, 0)

  ready.value = true
})
</script>
<route>
{
  name: "Runner"
}
</route>
