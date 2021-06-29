<script setup lang="ts">
import { stringify } from '@vueuse/docs-utils'
import { reactive } from 'vue'
import { useDeviceOrientation } from '.'

const orientation = reactive(useDeviceOrientation())
const text = stringify(orientation)
</script>

<template>
  <pre lang="yaml">{{ text }}</pre>
</template>
