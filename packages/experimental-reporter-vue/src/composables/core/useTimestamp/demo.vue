<script setup lang="ts">
import { useTimestamp } from '.'

const timestamp = useTimestamp()
</script>

<template>
  <div>Timestamp: {{ timestamp }}</div>
</template>
