<script setup lang="ts">
import { reactive } from 'vue'
import YAML from 'js-yaml'
import { useDevicePixelRatio } from '.'

const pixelRatio = reactive(useDevicePixelRatio())
const code = YAML.dump(pixelRatio)
</script>

<template>
  <div>Device Pixel Ratio:</div>
  <pre>{{ code }}</pre>
</template>
