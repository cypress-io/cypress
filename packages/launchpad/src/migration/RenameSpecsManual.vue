<template>
  <div class="text-16px leading-24px">
    <MigrationTitle :title="t('migration.renameManual.title')" />
    <MigrationList>
      <template #line-1>
        <i18n-t
          scope="global"
          keypath="migration.renameManual.componentFolderRemoved"
        >
          <CodeTag class="text-red-500">
            componentFolder
          </CodeTag>
        </i18n-t>
      </template>
      <template #line-2>
        <i18n-t
          scope="global"
          keypath="migration.renameManual.cannotAuto"
        >
          <CodeTag class="text-jade-500">
            src/component/button/button.cy.js
          </CodeTag>
        </i18n-t>
      </template>
      <template #line-3>
        <i18n-t
          scope="global"
          keypath="migration.renameManual.ifSkipNote"
        />
      </template>
    </MigrationList>
    <div class="border rounded border-gray-100 mt-16px">
      <div class="py-4px">
        <div
          v-for="(file, index) of props.gql.manualFiles?.files"
          :key="index"
          class="flex border-t-gray-50 h-40px mx-16px items-center"
          :class="{'border-t': index > 0}"
        >
          <span v-if="file.moved">
            ✅
          </span>
          <i-cy-document-text_x16
            v-else
            class="h-16px mr-8px w-16px inline-block icon-dark-gray-400 icon-light-gray-50"
          />
          <span>
            {{ file.relative }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CodeTag from '@cy/components/CodeTag.vue'
import { useI18n } from '@cy/i18n'
import MigrationTitle from './fragments/MigrationTitle.vue'
import MigrationList from './fragments/MigrationList.vue'
import { gql } from '@urql/vue'
import type { RenameSpecsManualFragment } from '../generated/graphql'

gql`
fragment RenameSpecsManual on Migration {
  manualFiles {
    completed
    files {
      relative
      moved
    }
  }
}`

const props = defineProps<{
  gql: RenameSpecsManualFragment
}>()

const { t } = useI18n()
</script>
