<script setup lang="ts">
import { usePreferredLanguages } from '.'

const languages = usePreferredLanguages()
</script>

<template>
  <note class="mb-2">
    Preferred Languages:
  </note>
  <div>
    <code v-for="lang in languages" :key="lang" class="mr-2">{{ lang }}</code>
  </div>
</template>
