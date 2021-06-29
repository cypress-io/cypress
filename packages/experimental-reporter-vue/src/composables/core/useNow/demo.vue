<script setup lang="ts">
import { useNow } from '.'

const now = useNow()
</script>

<template>
  <div>Now: {{ now }}</div>
</template>
