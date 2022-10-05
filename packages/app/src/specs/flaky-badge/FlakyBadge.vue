<template>
  <Badge
    :label="t('specPage.flaky.badgeLabel')"
    status="warning"
    class="font-bold uppercase"
    data-cy="flaky-badge"
  />
</template>

<script setup lang="ts">
import Badge from '@packages/frontend-shared/src/components/Badge.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

</script>
