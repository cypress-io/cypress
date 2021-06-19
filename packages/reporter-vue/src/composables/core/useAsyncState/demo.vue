<script setup lang="ts">
import axios from 'axios'
import YAML from 'js-yaml'
import { useAsyncState } from '.'

const { state, isReady, execute } = useAsyncState(
  () => axios.get('https://jsonplaceholder.typicode.com/todos/1').then(t => t.data),
  {},
  {
    delay: 2000,
    resetOnExecute: false,
  },
)
</script>

<template>
  <div>
    <note>Ready: {{ isReady.toString() }}</note>
    <pre lang="json" class="ml-2">{{ YAML.dump(state) }}</pre>
    <button @click="execute(2000)">
      Execute
    </button>
  </div>
</template>
