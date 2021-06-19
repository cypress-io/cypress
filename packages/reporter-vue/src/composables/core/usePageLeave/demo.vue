<script setup lang="ts">
import { usePageLeave } from '.'

const isLeft = usePageLeave()
</script>

<template>
  <pre lang="json">{{ { isLeft } }}</pre>
</template>
