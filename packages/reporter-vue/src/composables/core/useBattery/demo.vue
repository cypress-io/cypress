<script setup lang="ts">
import { reactive } from 'vue'
import { useBattery } from '.'
import { stringify } from '@vueuse/docs-utils'

const battery = reactive(useBattery())
const text = stringify(battery)
</script>

<template>
  <pre lang="yaml">{{ text }}</pre>
</template>
