<template>
  <div class="text-16px leading-24px">
    <MigrationTitle :title="t('migration.renameManual.title')" />
    <MigrationList>
      <template #line-1>
        <i18n-t keypath="migration.renameManual.componentFolderRemoved">
          <CodeTag class="text-red-500">
            componentFolder
          </CodeTag>
        </i18n-t>
      </template>
      <template #line-2>
        <i18n-t keypath="migration.renameManual.cannotAuto">
          <CodeTag class="text-jade-500">
            src/component/button/button.cy.js
          </CodeTag>
        </i18n-t>
      </template>
      <template #line-3>
        <i18n-t keypath="migration.renameManual.ifSkipNote" />
      </template>
    </MigrationList>
    <div class="border rounded border-gray-100 mt-16px">
      <HighlightedFilesList
        :files="props.gql.manualFiles"
        :highlight-reg-exp="/\.cy\.(js|ts)x?$/gi"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CodeTag from '@cy/components/CodeTag.vue'
import HighlightedFilesList from './fragments/HighlightedFilesList.vue'
import { useI18n } from '@cy/i18n'
import MigrationTitle from './fragments/MigrationTitle.vue'
import MigrationList from './fragments/MigrationList.vue'
import { gql } from '@urql/vue'
import type { RenameSpecsManualFragment } from '../generated/graphql'

gql`
fragment RenameSpecsManual on Migration {
  manualFiles
}`

const props = defineProps<{
  gql: RenameSpecsManualFragment
}>()

const { t } = useI18n()
</script>
