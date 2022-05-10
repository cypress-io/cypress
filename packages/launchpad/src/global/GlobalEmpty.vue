<template>
  <main class="text-center">
    <h1 class="mb-2 text-2rem">
      {{ t('globalPage.empty.title') }}
    </h1>
    <p class="font-light text-lg mb-6 text-gray-600">
      {{ t('globalPage.empty.helper') }}
    </p>
    <FileDropzone @addProject="emit('addProject', $event)" />
  </main>
</template>

<script lang="ts" setup>
import FileDropzone from './FileDropzone.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
const emit = defineEmits<{
  (e: 'addProject', value: string | null): void
}>()

</script>
