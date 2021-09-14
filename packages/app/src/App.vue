<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Foo from './components/Foo.vue'
import { renderRunner } from './runner/renderRunner'
import { gql, useQuery } from '@urql/vue'
import { AppDocument } from './generated/graphql'

gql`
query App {
  app {
    ...Foo
  }
}
`

const query = useQuery({ query: AppDocument })

const target = ref(null)

onMounted(async () => {
  const config = await (await fetch('/__/api')).json()
  renderRunner(() => {
    // @ts-ignore - yes it does
    window.Runner.start(target.value, config.base64Config)
  })
})
</script>

<template>
    <Foo v-if="query.data.value" :gql="query.data.value.app" />
  <div id="target" ref="target"></div>
</template>