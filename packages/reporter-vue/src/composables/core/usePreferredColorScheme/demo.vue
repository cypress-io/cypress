<script setup lang="ts">
import { usePreferredColorScheme } from '.'

const colorScheme = usePreferredColorScheme()
</script>

<template>
  <note class="mb-2">
    Preferred Color Scheme:
  </note>
  <code>{{ colorScheme }}</code>
</template>
