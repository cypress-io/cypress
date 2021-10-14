<template>
  <div class="inline-flex items-center">
    <span class="text-center rounded select-none bg-jade-100 text-jade-600 my-8px mr-8px px-8px">{{ t('components.fileSearch.matchesIndicator', {
    count }) }}</span>
  </div>
</template>
<script lang="ts" setup>
import { useI18n } from '@cy/i18n'

defineProps<{
  count: number
}>()
const { t } = useI18n()
</script>