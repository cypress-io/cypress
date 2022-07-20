<template>
  <div
    class="font-bold bg-orange-50 rounded-4px text-xs px-4px text-orange-600 items-center uppercase"
    style="width: fit-content"
    data-cy="flaky-badge"
  >
    {{ t('specPage.flaky.badgeLabel') }}
  </div>
</template>

<script setup lang="ts">

import { useI18n } from '@cy/i18n'

const { t } = useI18n()

</script>
