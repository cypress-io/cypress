<template>
  <MigrationTitle :title="t('migration.renameSupport.title')" />
  <MigrationList>
    <template #line-1>
      {{ t('migration.renameSupport.serveDifferentTypes') }}
    </template>
    <template #line-2>
      {{ t('migration.renameSupport.changedSupportFile') }}
      <CodeTag
        class="text-red-500"
      >cypress/support/index.js</CodeTag>
      <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
      <CodeTag
        class="text-jade-500"
      >cypress/support/e2e.js</CodeTag>
    </template>
  </MigrationList>
  <BeforeAfter>
    <template #before>
      <HighlightedFilesList
        :files="props.gql.supportFiles.before"
        highlight-class="text-red-500"
      />
    </template>
    <template #after>
      <HighlightedFilesList
        :files="props.gql.supportFiles.after"
        highlight-class="text-jade-500"
      />
    </template>
  </BeforeAfter>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import CodeTag from '@cy/components/CodeTag.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'
import MigrationList from './fragments/MigrationList.vue'
import HighlightedFilesList from './fragments/HighlightedFilesList.vue'
import BeforeAfter from './fragments/BeforeAfter.vue'
import type { RenameSupportFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment RenameSupport on Migration {
  supportFiles {
    before {
      parts {
        text
        highlight
      }
    }
    after {
      parts {
        text
        highlight
      }
    }
  }
}`

const props = defineProps<{
  gql: RenameSupportFragment
}>()
</script>
