<template>
  <div class="text-center">
    <h1 class="mb-2 text-2rem">
      {{ t('globalPage.empty.title') }}
    </h1>
    <p class="mb-6 text-lg font-light text-body-gray">
      {{ t('globalPage.empty.helper') }}
    </p>
    <FileDropzone @addProject="emit('addProject', $event)" />
  </div>
</template>

<script lang="ts" setup>
import FileDropzone from './FileDropzone.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
const emit = defineEmits<{
  (e: 'addProject', value: string | null): void
}>()

</script>
