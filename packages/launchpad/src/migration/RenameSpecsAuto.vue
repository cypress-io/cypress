<template>
  <div class="text-16px leading-24px">
    <MigrationTitle :title="t('migration.renameAuto.title')" />
    <MigrationList>
      <MigrationListItem>
        {{ t('migration.renameAuto.changedSpecFolder') }}
        <CodeTag
          class="text-red-500"
        >cypress/integration</CodeTag>
        <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
        <CodeTag
          class="text-jade-500"
        >cypress/e2e</CodeTag>
      </MigrationListItem>
      <MigrationListItem>
        <template
          v-if="selectOption === 'skip'"
        >
          {{ t('migration.renameAuto.optedOutMessage') }}
        </template>
        <template
          v-if="selectOption === 'renameFolder'"
        >
          {{ t('migration.renameAuto.folderRenameMessage') }}
        </template>
        <template v-else>
          {{ t('migration.renameAuto.changedSpecExt') }}
          <CodeTag
            class="text-red-500"
          >[filename].spec.[ext]</CodeTag>
          <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
          <CodeTag
            class="text-jade-500"
          >[filename].cy.[ext]</CodeTag>
        </template>
        <span class="m-8px text-gray-100">——</span>
        <a
          class="cursor-pointer text-indigo-500 hover:underline"
          @click="step1Modal = true"
        >
          {{ t('migration.renameAuto.changeButton') }}
        </a>
      </MigrationListItem>
      <MigrationListItem v-if="!selectOption">
        <i18n-t
          scope="global"
          keypath="migration.renameAuto.changedSpecPatternExplain"
        >
          <CodeTag class="text-jade-500">
            [filename].cy.[ext]
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
    </MigrationList>
    <BeforeAfter>
      <template #before>
        <HighlightedFilesList
          :files="props.gql.specFiles.map(x => x.before)"
          highlight-class="text-red-500"
        />
      </template>
      <template #after>
        <HighlightedFilesList
          :files="props.gql.specFiles.map(x => x.after)"
          highlight-class="text-jade-500"
        />
      </template>
    </BeforeAfter>
    <OptOutModalStep1
      v-if="step1Modal"
      @proceed="
        step1Modal = false;
        step2Modal = true;
      "
      @cancel="step1Modal = false"
    />
    <OptOutModalStep2
      v-if="step2Modal"
      :has-custom-integration-folder="props.gql.hasCustomIntegrationFolder"
      @cancel="step2Modal = false"
      @save="(val) => {
        step2Modal = false;
        applySkipResult(val)
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import CodeTag from '@cy/components/CodeTag.vue'
import BeforeAfter from './fragments/BeforeAfter.vue'
import HighlightedFilesList from './fragments/HighlightedFilesList.vue'
import MigrationList from './fragments/MigrationList.vue'
import MigrationListItem from './fragments/MigrationListItem.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'
import OptOutModalStep1 from './OptOutModalStep1.vue'
import OptOutModalStep2 from './OptOutModalStep2.vue'
import { gql } from '@urql/vue'
import type { RenameSpecsAutoFragment } from '../generated/graphql'
import type { PossibleOption } from './types'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment RenameSpecsAuto on Migration {
  hasCustomIntegrationFolder
  specFiles {
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
  gql: RenameSpecsAutoFragment
}>()

const emits = defineEmits<{
  (eventName: 'selectOption', value: PossibleOption): void
}>()

const step1Modal = ref(false)
const step2Modal = ref(false)

// probably to be changed for a GQL field
const selectOption = ref<PossibleOption>()

function applySkipResult (val: PossibleOption) {
  // TODO: add a GQL mutation here
  selectOption.value = val
  emits('selectOption', selectOption.value)
}
</script>
