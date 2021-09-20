<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gql, useQuery } from '@urql/vue'
import { renderRunner } from './runner/renderRunner'
import Foo from './Foo.vue'
import { AppDocument } from './generated/graphql'

const target = ref(null)

gql`
query App {
  ...Foo
}
`

const query = useQuery({ query: AppDocument })

onMounted(async () => {
  const config = await (await fetch('/__/api')).json()
  renderRunner(() => {
    // @ts-ignore - yes it does
    window.Runner.start(target.value, config.base64Config)
  })
})
</script>

<template>
  <Foo v-if="query.data.value" :gql="query.data.value" />
  <div id="target" ref="target"></div>
</template>