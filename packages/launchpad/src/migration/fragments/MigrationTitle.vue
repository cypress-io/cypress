<template>
  <h3 class="font-medium mb-8px text-gray-900 leading-28px">
    {{ title }}
  </h3>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineProps<{
  title: string
}>()
</script>
