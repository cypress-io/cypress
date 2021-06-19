<script setup lang="ts">
import { isDark } from '../../.vitepress/theme/composables/dark'
import { useToggle } from '../../shared'

// const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <button @click="toggleDark">
    <carbon-moon v-if="isDark" />
    <carbon-sun v-else />

    <span class="ml-2">{{ isDark ? 'Dark': 'Light' }}</span>
  </button>
</template>
