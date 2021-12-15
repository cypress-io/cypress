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
          :files="props.gql.specFilesBefore"
          :highlight-reg-exp="/(integration|[_,-,.]?spec)/gi"
          highlight-class="text-red-500"
        />
      </template>
      <template #after>
        <HighlightedFilesList
          :files="props.gql.specFilesAfter"
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
import MigrationList from './fragments/MigrationList.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'
import { gql } from '@urql/vue'
import type { RenameSpecsAutoFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment RenameSpecsAuto on Migration {
  specFilesBefore
  specFilesAfter
}`

const props = defineProps<{
  gql: RenameSpecsAutoFragment
}>()
</script>
