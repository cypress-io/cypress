<template>
  <div
    class="deprecated-ribbon font-medium leading-[24px] text-[14px] text-center text-orange-600 bg-orange-100 absolute select-none top-[24px] right-[-26px] w-[124px] rotate-45"
    data-cy="deprecated-ribbon"
  >
    <slot>{{ t('openBrowser.deprecatedRibbon') }}</slot>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
</script>
