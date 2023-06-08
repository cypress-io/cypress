<template>
  <div class="text-[16px] leading-[24px]">
    <MigrationTitle :title="t('migration.renameManual.title')" />
    <MigrationList>
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.renameManual.componentFolderRemoved"
        >
          <CodeTag class="text-red-500">
            componentFolder
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.renameManual.addedSpecPattern"
        >
          <CodeTag class="text-jade-500">
            specPattern
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.renameManual.cannotAuto"
        >
          <CodeTag class="text-jade-500">
            src/component/button/button.cy.js
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.renameManual.ifSkipNote"
        />
      </MigrationListItem>
    </MigrationList>
    <div class="border rounded border-gray-100 mt-[16px]">
      <div class="py-[4px]">
        <div
          v-for="(file, index) of props.gql.manualFiles?.files"
          :key="index"
          class="flex border-t-gray-50 h-[40px] mx-[16px] items-center"
          :class="{'border-t': index > 0}"
        >
          <template v-if="file.moved">
            <i-cy-status-pass-duotone_x24
              class="h-[16px] w-[16px]"
            />
            <span
              class="text-gray-600 line-through pl-[8px]"
              data-cy="moved"
            >
              {{ file.relative }}
            </span>
          </template>
          <template v-else>
            <i-cy-document-text_x16
              class="h-[16px] mr-[8px] w-[16px] inline-block icon-dark-gray-400 icon-light-gray-50"
            />
            <span>
              {{ file.relative }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue'
import CodeTag from '@cy/components/CodeTag.vue'
import { useI18n } from '@cy/i18n'
import MigrationTitle from './fragments/MigrationTitle.vue'
import MigrationList from './fragments/MigrationList.vue'
import MigrationListItem from './fragments/MigrationListItem.vue'
import { gql, useMutation } from '@urql/vue'
import { RenameSpecsManual_CloseWatcherDocument } from '../generated/graphql'
import type { RenameSpecsManualFragment } from '../generated/graphql'

gql`
fragment RenameSpecsManual on Migration {
  manualFiles {
    id
    completed
    files {
      id
      relative
      moved
    }
  }
}`

gql`
mutation RenameSpecsManual_CloseWatcher {
  migrateCloseManualRenameWatcher
}
`

const props = defineProps<{
  gql: RenameSpecsManualFragment
}>()

const closeWatcherMutation = useMutation(RenameSpecsManual_CloseWatcherDocument)

onUnmounted(() => {
  closeWatcherMutation.executeMutation({})
})

const { t } = useI18n()
</script>
