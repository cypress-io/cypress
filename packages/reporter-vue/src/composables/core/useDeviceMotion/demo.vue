<script setup lang="ts">
import { stringify } from '@vueuse/docs-utils'
import { reactive } from 'vue'
import { useDeviceMotion } from '.'

const motion = reactive(useDeviceMotion())
const text = stringify(motion)
</script>

<template>
  <note class="mb-2">
    Device Motion:
  </note>
  <pre lang="yaml">{{ text }}</pre>
</template>
