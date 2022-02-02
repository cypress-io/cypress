<template>
  <MigrationTitle
    :title="t('migration.setupComponent.title')"
  />
  <MigrationList>
    <MigrationListItem>
      {{ t('migration.setupComponent.line1') }}
    </MigrationListItem>
    <MigrationListItem>
      {{ t('migration.setupComponent.line2') }}
    </MigrationListItem>
    <MigrationListItem>
      {{ t('migration.setupComponent.line3') }}
    </MigrationListItem>
    <MigrationListItem>
      {{ t('migration.setupComponent.line4') }}
    </MigrationListItem>
  </MigrationList>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import MigrationTitle from './fragments/MigrationTitle.vue'
import MigrationList from './fragments/MigrationList.vue'
import MigrationListItem from './fragments/MigrationListItem.vue'

const { t } = useI18n()

</script>
