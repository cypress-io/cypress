<template>
  <div class="inline-flex items-center flex-grow group">
  <i-cy-magnifying-glass_x16 class="inline-block ml-12px mr-8px icon-light-gray-50 icon-dark-gray-500 group-focus-within:icon-light-indigo-50 group-focus-within:icon-dark-indigo-400"/>
  <input
  class="flex-grow p-0 text-gray-700 placeholder-gray-400 border-transparent outline-none hocus:border-transparent"
  type="search"
  :placeholder="t('components.fileSearch.byFilenameInput')">
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
const { t } = useI18n()
</script>