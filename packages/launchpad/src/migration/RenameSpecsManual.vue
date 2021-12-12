<template>
  <div class="text-16px leading-24px">
    <h3 class="font-medium my-8px text-gray-900 leading-28px">
      {{ t('migration.renameManual.title') }}
    </h3>
    <ul class="list-disc pl-24px text-jade-400">
      <li class="mb-4px">
        <span class="text-gray-600">
          <i18n-t keypath="migration.renameManual.componentFolderRemoved">
            <CodeTag class="text-red-500">componentFolder</CodeTag>
          </i18n-t>
        </span>
      </li>
      <li class="mb-4px">
        <span class="text-gray-600">
          <i18n-t keypath="migration.renameManual.addedSpecPattern">
            <CodeTag class="text-jade-500">specPattern</CodeTag>
          </i18n-t>
        </span>
      </li>
      <li class="mb-4px">
        <span class="text-gray-600">
          <i18n-t keypath="migration.renameManual.cannotAuto">
            <CodeTag class="text-jade-500">src/component/button/button.cy.js</CodeTag>
          </i18n-t>
        </span>
      </li>
      <li class="mb-4px">
        <span class="text-gray-600">
          <i18n-t keypath="migration.renameManual.ifSkipNote" />
        </span>
      </li>
    </ul>
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
