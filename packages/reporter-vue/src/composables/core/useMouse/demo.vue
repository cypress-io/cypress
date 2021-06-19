<script setup lang="ts">
import { reactive } from 'vue'
import { useMouse } from '.'
import { stringify } from '@vueuse/docs-utils'

const mouse = reactive(useMouse())
const text = stringify(mouse)
</script>

<template>
  <pre lang="yaml">{{ text }}</pre>
</template>
