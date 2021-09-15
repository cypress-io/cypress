<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import Foo from './Foo.vue'
import { AppDocument } from './generated/graphql'
import { computed, onMounted, ref } from 'vue'
import { renderRunner } from './runner/renderRunner'
import Walkthrough from './components/Walkthrough.vue'

function decodeBase64Unicode(str) {
  return decodeURIComponent(atob(str).split('').map((char) => {
    return `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`
  }).join(''))
}

const target = ref(null)
const rawCypressConfig = ref();
const cypressConfig = computed(() => rawCypressConfig.value ? JSON.parse(decodeBase64Unicode(rawCypressConfig.value)) : null)
const showPreview = ref(true)

gql`
query App {
  app {
    ...Foo
  }
}
`

const query = useQuery({ query: AppDocument })

onMounted(async () => {
  const config = await (await fetch('/__/api')).json()
  rawCypressConfig.value = config.base64Config;
  // renderRunner(() => {
  //   // @ts-ignore - yes it does
  //   window.Runner.start(target.value, rawCypressConfig.value)
  // })
})

async function closePreview(newSpecs) {
  showPreview.value = false
  const config = await (await fetch('/__/api')).json()
  renderRunner(() => {
    // @ts-ignore - yes it does
    window.Runner.start(target.value, config.base64Config)
  })
}
</script>

<template>
  <Foo v-if="query.data.value" :gql="query.data.value.app" />
  <div id="target" ref="target"></div>
  <Walkthrough v-if="cypressConfig && showPreview" :cypressConfig="cypressConfig" @closePreview="closePreview"/>
</template>