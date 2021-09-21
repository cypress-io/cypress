<script setup lang="ts">
// import { onMounted, ref } from 'vue'
// import { gql, useQuery } from '@urql/vue'
// import { renderRunner } from './runner/renderRunner'
// import Foo from './Foo.vue'
// import { AppDocument } from './generated/graphql'

// const target = ref(null)

// gql`
// query App {
//   app {
//     ...Foo
//   }
// }
// `

// const query = useQuery({ query: AppDocument })

// onMounted(async () => {
//   const config = await (await fetch('/__/api')).json()
//   renderRunner(() => {
//     // @ts-ignore - yes it does
//     window.Runner.start(target.value, config.base64Config)
//   })
// })
const callMe = (component) => {
  component;
  debugger;
}
</script>

<template>
  <router-view v-slot="{ Component, route }">
  {{ route }}
    <button @click="callMe(Component)">Click me</button>
    <transition name="slide">
      <component :is="Component" :key="route" />
    </transition>
  </router-view>
</template>
