<template>
  <div
    class="deprecated-ribbon font-medium leading-[16px] text-[12px] text-center text-warning-700 bg-warning-200 absolute select-none top-[20px] right-[-30px] w-[130px] rotate-45 py-[2px]"
    data-cy="deprecated-ribbon"
  >
    <slot>{{ t('openBrowser.deprecatedRibbon') }}</slot>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
</script>
