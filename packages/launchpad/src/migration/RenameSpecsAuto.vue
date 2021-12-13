<template>
  <div class="text-16px leading-24px">
    <MigrationTitle :title="t('migration.renameAuto.title')" />
    <MigrationList>
      <template #line-1>
        {{ t('migration.renameAuto.changedSpecFolder') }}
        <CodeTag
          class="text-red-500"
        >cypress/integration</CodeTag>
        <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
        <CodeTag
          class="text-jade-500"
        >cypress/e2e</CodeTag>
      </template>
      <template #line-2>
        {{ t('migration.renameAuto.changedSpecExt') }}
        <CodeTag
          class="text-red-500"
        >[filename].spec.[ext]</CodeTag>
        <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
        <CodeTag
          class="text-jade-500"
        >[filename].cy.[ext]</CodeTag>
      </template>
      <template #line-3>
        <i18n-t keypath="migration.renameAuto.changedE2EFolder">
          <CodeTag>integrationFolder</CodeTag>
        </i18n-t>
      </template>
    </MigrationList>
    <BeforeAfter>
      <template #before>
        <HighlightedFilesList
          :files="filesBefore"
          :highlight-reg-exp="/(integration|[_,-,.]?spec)/gi"
          highlight-class="text-red-500"
        />
      </template>
      <template #after>
        <HighlightedFilesList
          :files="filesAfter"
          :highlight-reg-exp="/(e2e|\.cy)/gi"
          highlight-class="text-jade-500"
        />
      </template>
    </BeforeAfter>
  </div>
</template>

<script lang="ts" setup>
import CodeTag from '@cy/components/CodeTag.vue'
import BeforeAfter from './fragments/BeforeAfter.vue'
import HighlightedFilesList from './fragments/HighlightedFilesList.vue'
import { useI18n } from '@cy/i18n'
import MigrationList from './fragments/MigrationList.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'

const { t } = useI18n()

// TODO: wire this properly
const filesBefore = [
  'cypress/integration/app_spec.js',
  'cypress/integration/blog-post-spec.js',
  'cypress/integration/homeSpec.js',
  'cypress/integration/company.js',
  'cypress/integration/sign-up.spec.js',
  'cypress/component/button.spec.js',
]

// TODO: wire this properly
const filesAfter = [
  'cypress/e2e/app.cy.js',
  'cypress/e2e/blog-post.cy.js',
  'cypress/e2e/homeSpec.cy.js',
  'cypress/e2e/company.cy.js',
  'cypress/e2e/sign-up.cy.js',
  'cypress/component/button.cy.js',
]
</script>
