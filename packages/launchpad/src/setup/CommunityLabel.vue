<template>
  <span class="text-jade-600 bg-jade-50 border-jade-300 border rounded p-[2px] ml-[4px] pr-[3px]">
    <!-- for screen readers -->
    <span class="sr-only">
      {{ t('versions.communityNote') }}
    </span>
    {{ t('versions.community') }}
  </span>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
