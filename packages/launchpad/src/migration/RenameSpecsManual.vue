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
        :files="files"
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

const { t } = useI18n()

// TODO: wire this properly
const files = [
  'cypress/component/button.cy.js',
  'cypress/component/modal.cy.js',
  'cypress/component/toggle.cy.js',
  'cypress/component/alert.cy.js',
  'cypress/component/tooltip.cy.js',
]
</script>
