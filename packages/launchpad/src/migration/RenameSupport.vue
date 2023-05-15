<template>
  <MigrationTitle :title="t('migration.renameSupport.title')" />
  <MigrationList>
    <MigrationListItem>
      {{ t('migration.renameSupport.serveDifferentTypes') }}
    </MigrationListItem>
    <MigrationListItem>
      {{ t('migration.renameSupport.changedSupportFile') }}
      <CodeTag
        class="text-red-500"
      >cypress/support/index.js</CodeTag>
      <i-cy-arrow-right_x16 class="h-[16px] w-[16px] inline-block icon-dark-gray-300" />
      <CodeTag
        class="text-jade-500"
      >cypress/support/e2e.js</CodeTag>
    </MigrationListItem>
  </MigrationList>
  <BeforeAfter>
    <template #before>
      <HighlightedFilesList
        :files="props.gql.supportFiles?.before ? [props.gql.supportFiles.before] : []"
        highlight-class="text-red-500"
      />
    </template>
    <template #after>
      <HighlightedFilesList
        :files="props.gql.supportFiles?.after ? [props.gql.supportFiles.after] : []"
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
import MigrationListItem from './fragments/MigrationListItem.vue'

const { t } = useI18n()

gql`
fragment RenameSupport on Migration {
  supportFiles {
    before {
      id
      parts {
        id
        text
        highlight
      }
    }
    after {
      id
      parts {
        id
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
