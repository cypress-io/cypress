<script setup lang="ts">
import { createGlobalState } from '.'
import { useStorage } from '../useStorage'
import { stringify } from '@vueuse/docs-utils'
import { reactive } from 'vue'

const useState = createGlobalState(() => {
  return useStorage('vue-use-locale-storage', {
    name: 'Banana',
    color: 'Yellow',
    size: 'Medium',
  })
})

const state = useState()
const text = stringify(state)
</script>

<template>
  <div>
    <input v-model="state.name" type="text">
    <input v-model="state.color" type="text">
    <input v-model="state.size" type="text">

    <pre lang="yaml">{{ text }}</pre>
  </div>
</template>
