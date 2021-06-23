<script setup lang="ts">
import { stringify } from '@vueuse/docs-utils'
import { useStorage } from '.'

const state = useStorage('vue-use-locale-storage', {
  name: 'Banana',
  color: 'Yellow',
  size: 'Medium',
})

const text = stringify(state.value)
</script>

<template>
  <div>
    <input v-model="state.name" type="text">
    <input v-model="state.color" type="text">
    <input v-model="state.size" type="text">

    <pre lang="json">{{ text }}</pre>
  </div>
</template>
