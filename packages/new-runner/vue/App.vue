<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
  <div ref="reactTarget"></div>
</template>

<script lang="ts" setup>
import HelloWorld from './components/HelloWorld.vue'
import { onMounted, ref } from 'vue'
import { renderReact } from '../react/entry'

const reactTarget = ref(null)

onMounted(() => {
  renderReact(reactTarget.value)
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
