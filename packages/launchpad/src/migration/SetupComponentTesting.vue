<template>
  <MigrationTitle
    :title="t('migration.setupComponent.title')"
  />
  <MigrationList>
    <template #line-1>
      {{ t('migration.setupComponent.line1') }}
    </template>
    <template #line-2>
      {{ t('migration.setupComponent.line2') }}
    </template>
    <template #line-3>
      {{ t('migration.setupComponent.line3') }}
    </template>
    <template #line-4>
      {{ t('migration.setupComponent.line4') }}
    </template>
  </MigrationList>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import MigrationList from './fragments/MigrationList.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'

const { t } = useI18n()

</script>
