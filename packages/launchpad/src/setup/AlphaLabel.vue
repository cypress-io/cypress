<template>
  <span class="text-warning-600 bg-warning-50 border-warning-300 border border-transparent rounded p-[2px] ml-[4px] pr-[3px]">
    <!-- for screen readers -->
    <span class="sr-only">
      Support is in
    </span>
    {{ t('versions.alpha') }}
  </span>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
