<script setup lang="ts">
import { stringify } from '@vueuse/docs-utils'
import { reactive } from 'vue'
import { useNetwork } from '.'

const network = reactive(useNetwork())
const text = stringify(network)
</script>

<template>
  <pre lang="yaml">{{ text }}</pre>
</template>
